from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from game.request import SocketHandler, SocketRequest, SocketResponse

from .router import handlepatterns
from .utils import (
    get_game_by_code,
    get_game_data,
    get_player_by_id,
    get_player_data,
)


class GameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["code"]
        self.room_group_name = f"game_{self.room_name}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        query_string = self.scope["query_string"].decode("utf-8")
        query_params = parse_qs(query_string)

        game = await database_sync_to_async(get_game_by_code)(self.room_name)

        if not game or not game.id:
            await self.close()

        pId_raw = query_params.get("pId", [None])[0]
        pId = None if pId_raw in [None, "null", "undefined"] else pId_raw

        player = None
        player_data = None

        if pId:
            player = await database_sync_to_async(get_player_by_id)(pId)
            if player:
                player_data = await database_sync_to_async(get_player_data)(player.id)

        self.scope["player"] = player

        await self.send_json(
            {
                "action": "init",
                "request_id": -1,
                "data": await database_sync_to_async(get_game_data)(game.id),
                "player": player_data,
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content: dict[str, Any]):
        game = await database_sync_to_async(get_game_by_code)(self.room_name)
        request = await database_sync_to_async(SocketRequest.from_content)(content, game)   

        self.scope["player"] = request.player

        action: type[SocketHandler] | None = handlepatterns.get(request.action)

        if action:
            request.code = request.action
            await action(self).dispatch(request)
        else:
            response = SocketResponse(
                action="error",
                request_id=request.request_id,
                message=f"Неизвестное действие: {request.action}",
            )
            await response.send(self)

    async def update(self, event):
        data = event["payload"].copy()
        data["action"] = "update"

        player = self.scope.get("player")

        data["player"] = None
        if player and hasattr(player, "id"):
            try:
                data["player"] = await database_sync_to_async(get_player_data)(
                    player.id
                )
            except Exception:
                data["player"] = None
        await self.send_json(data)
