from unittest.mock import patch

from asgiref.sync import async_to_sync, database_sync_to_async
from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.core.cache import cache
from django.test import TransactionTestCase, override_settings

from game.models import GameRoom, Player
from game.request import SocketResponse
from game.router import handlepatterns
from game.routing import websocket_urlpatterns


TEST_CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
}


@override_settings(
    CHANNEL_LAYERS=TEST_CHANNEL_LAYERS,
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
)
class GameConsumerTests(TransactionTestCase):
    """Integration tests for the websocket route and every registered action."""

    reset_sequences = True

    def setUp(self):
        cache.clear()
        self.game = GameRoom.objects.create(code="ROOM42", name="Test room")
        self.application = URLRouter(websocket_urlpatterns)

    def tearDown(self):
        cache.clear()
        super().tearDown()

    def test_connection_returns_initial_game_state(self):
        async_to_sync(self._assert_initial_message)()

    async def _assert_initial_message(self):
        communicator = WebsocketCommunicator(
            self.application, f"/ws/game/{self.game.code}/"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        response = await communicator.receive_json_from()
        self.assertEqual(response["action"], "init")
        self.assertEqual(response["request_id"], -1)
        self.assertEqual(response["data"]["game"]["code"], self.game.code)
        self.assertIsNone(response["player"])
        await communicator.disconnect()

    def test_player_connection_updates_admin_presence_until_disconnect(self):
        player = Player.objects.create(room=self.game, name="Crewmate")
        async_to_sync(self._assert_player_presence_is_broadcast)(player.pk)

    async def _assert_player_presence_is_broadcast(self, player_id):
        admin = WebsocketCommunicator(
            self.application, f"/ws/game/{self.game.code}/"
        )
        player_client = WebsocketCommunicator(
            self.application,
            f"/ws/game/{self.game.code}/?pId={player_id}",
        )

        self.assertTrue((await admin.connect())[0])
        await admin.receive_json_from()  # admin init
        self.assertTrue((await player_client.connect())[0])

        player_init = await player_client.receive_json_from()
        self.assertEqual(player_init["player"]["id"], player_id)
        online_update = await admin.receive_json_from()
        self.assertTrue(online_update["data"]["game"]["players"][0]["is_online"])

        await player_client.disconnect()
        offline_update = await admin.receive_json_from()
        self.assertFalse(offline_update["data"]["game"]["players"][0]["is_online"])
        await admin.disconnect()

    def test_every_registered_action_is_dispatched_over_websocket(self):
        async_to_sync(self._assert_all_actions_are_dispatched)()

    async def _assert_all_actions_are_dispatched(self):
        tested_actions = set()

        for request_number, (action, handler_class) in enumerate(
            handlepatterns.items(), start=1
        ):
            with self.subTest(action=action):
                request_id = f"request-{request_number}"

                def handle(_handler, request, expected_action=action):
                    self.assertEqual(request.action, expected_action)
                    self.assertEqual(request.code, expected_action)
                    self.assertEqual(request.data, {"probe": expected_action})
                    return SocketResponse(
                        type="send",
                        action=request.action,
                        request_id=request.request_id,
                        code=request.code,
                        data={"handled": expected_action},
                    )

                with patch.object(handler_class, "handle", new=handle):
                    communicator = WebsocketCommunicator(
                        self.application, f"/ws/game/{self.game.code}/"
                    )
                    connected, _ = await communicator.connect()
                    self.assertTrue(connected)
                    await communicator.receive_json_from()  # init

                    await communicator.send_json_to(
                        {
                            "action": action,
                            "request_id": request_id,
                            "data": {"probe": action},
                        }
                    )
                    response = await communicator.receive_json_from()

                    self.assertEqual(response["action"], action)
                    self.assertEqual(response["request_id"], request_id)
                    self.assertEqual(response["code"], action)
                    self.assertEqual(response["data"], {"handled": action})
                    tested_actions.add(action)
                    await communicator.disconnect()

        self.assertSetEqual(tested_actions, set(handlepatterns))

    def test_broadcast_action_reaches_every_client_in_the_room(self):
        async_to_sync(self._assert_broadcast_reaches_room)()

    def test_direct_game_data_event_is_wrapped_for_frontend(self):
        async_to_sync(self._assert_direct_game_data_event)()

    async def _assert_direct_game_data_event(self):
        communicator = WebsocketCommunicator(
            self.application, f"/ws/game/{self.game.code}/"
        )
        self.assertTrue((await communicator.connect())[0])
        await communicator.receive_json_from()  # init

        await get_channel_layer().group_send(
            f"game_{self.game.code}",
            {
                "type": "update",
                "data": {"game": {"code": self.game.code}},
            },
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["action"], "update")
        self.assertEqual(response["data"]["game"]["code"], self.game.code)
        await communicator.disconnect()

    async def _assert_broadcast_reaches_room(self):
        action = next(iter(handlepatterns))
        handler_class = handlepatterns[action]

        def handle(_handler, request):
            return SocketResponse.from_request(request)

        with patch.object(handler_class, "handle", new=handle):
            first = WebsocketCommunicator(
                self.application, f"/ws/game/{self.game.code}/"
            )
            second = WebsocketCommunicator(
                self.application, f"/ws/game/{self.game.code}/"
            )
            self.assertTrue((await first.connect())[0])
            self.assertTrue((await second.connect())[0])
            await first.receive_json_from()
            await second.receive_json_from()

            await first.send_json_to(
                {"action": action, "request_id": "broadcast-1", "data": {}}
            )
            first_response = await first.receive_json_from()
            second_response = await second.receive_json_from()

            for response in (first_response, second_response):
                self.assertEqual(response["action"], "update")
                self.assertEqual(response["request_id"], "broadcast-1")
                self.assertEqual(response["code"], action)
                self.assertEqual(response["data"]["game"]["code"], self.game.code)

            await first.disconnect()
            await second.disconnect()

    def test_unknown_action_returns_correlated_error(self):
        async_to_sync(self._assert_unknown_action_error)()

    async def _assert_unknown_action_error(self):
        communicator = WebsocketCommunicator(
            self.application, f"/ws/game/{self.game.code}/"
        )
        self.assertTrue((await communicator.connect())[0])
        await communicator.receive_json_from()
        await communicator.send_json_to(
            {"action": "missing_action", "request_id": "unknown-1"}
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["action"], "error")
        self.assertEqual(response["request_id"], "unknown-1")
        self.assertIn("missing_action", response["message"])
        await communicator.disconnect()

    def test_unknown_room_is_closed_without_initial_payload(self):
        async_to_sync(self._assert_unknown_room_closed)()

    async def _assert_unknown_room_closed(self):
        communicator = WebsocketCommunicator(
            self.application, "/ws/game/DOES-NOT-EXIST/"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        event = await communicator.receive_output()
        self.assertEqual(event["type"], "websocket.close")

    def test_connection_closes_when_room_is_deleted_before_next_message(self):
        async_to_sync(self._assert_deleted_room_closes_connection)()

    async def _assert_deleted_room_closes_connection(self):
        communicator = WebsocketCommunicator(
            self.application, f"/ws/game/{self.game.code}/"
        )
        self.assertTrue((await communicator.connect())[0])
        await communicator.receive_json_from()

        await database_sync_to_async(self.game.delete)()
        await communicator.send_json_to({"action": "ping"})

        event = await communicator.receive_output()
        self.assertEqual(event["type"], "websocket.close")
        self.assertEqual(event["code"], 4004)

    def test_disconnect_after_room_deletion_cleans_player_presence(self):
        player = Player.objects.create(room=self.game, name="Crewmate")
        async_to_sync(self._assert_deleted_room_disconnect)(player.pk)

    async def _assert_deleted_room_disconnect(self, player_id):
        communicator = WebsocketCommunicator(
            self.application,
            f"/ws/game/{self.game.code}/?pId={player_id}",
        )
        self.assertTrue((await communicator.connect())[0])
        await communicator.receive_json_from()
        self.assertTrue(await cache.aget(f"player_online:{player_id}"))

        await database_sync_to_async(self.game.delete)()
        await communicator.disconnect()

        self.assertIsNone(await cache.aget(f"player_online:{player_id}"))
