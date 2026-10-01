from unittest.mock import patch

from asgiref.sync import async_to_sync
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase, override_settings

from game.models import GameRoom
from game.request import SocketResponse
from game.router import handlepatterns
from game.routing import websocket_urlpatterns


TEST_CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
}


@override_settings(CHANNEL_LAYERS=TEST_CHANNEL_LAYERS)
class GameConsumerTests(TransactionTestCase):
    """Integration tests for the websocket route and every registered action."""

    reset_sequences = True

    def setUp(self):
        self.game = GameRoom.objects.create(code="ROOM42", name="Test room")
        self.application = URLRouter(websocket_urlpatterns)

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
