from game.serializers import GameRoomSerializer
from game.models import GameRoom
from typing import Any
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from django.core.cache import cache

from game.request import SocketHandler, SocketRequest, SocketResponse

from .router import handlepatterns
from .utils import (
    get_game_by_code,
    get_game_data,
    get_player_by_id,
    get_player_data,
)


ONLINE_TTL = 60

class GameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["code"]
        self.room_group_name = f"game_{self.room_name}"
        self.admin_group_name = f"admin_{self.room_name}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        self.game = self.scope["game"]
        self.player = self.scope["player"]
        self.is_admin = self.scope["is_admin"]

        if self.player:
            await cache.aset(f"player_online:{self.player.id}", True, timeout=ONLINE_TTL)
            await SocketResponse(
                action="update",
                request_id="-1",
                data={"game": await database_sync_to_async(lambda: GameRoomSerializer(self.game).data)()},
            ).broadcast(
                type="admin_update",
                channel_layer=self.channel_layer,
                room_group_name=self.admin_group_name,
            )
        else:
            await self.channel_layer.group_add(self.admin_group_name, self.channel_name)

        await self.send_json(
            {
                "action": "init",
                "request_id": -1,
                "data": await database_sync_to_async(get_game_data)(self.game.id),
                "player": await database_sync_to_async(get_player_data)(self.player.id) if self.player else None,
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        if self.is_admin:
            await self.channel_layer.group_discard(self.admin_group_name, self.channel_name)
        else:
            await cache.adelete(f"player_online:{self.player.id}")
            await SocketResponse(
                action="update",
                request_id="-1",
                data={"game": await database_sync_to_async(lambda: GameRoomSerializer(self.game).data)()},
            ).broadcast(type="admin_update", channel_layer=self.channel_layer, room_group_name=self.admin_group_name)

    async def receive_json(self, content: dict[str, Any]):
        if self.player:
            await cache.atouch(f"player_online:{self.player.id}", timeout=ONLINE_TTL)

        if content.get("action") == "ping":
            await SocketResponse(
                action="update",
                request_id=content.get("request_id"),
                data={"game": await database_sync_to_async(lambda: GameRoomSerializer(self.game).data)()},
            ).broadcast(type="admin_update", channel_layer=self.channel_layer, room_group_name=self.admin_group_name)
            return

        request = await database_sync_to_async(SocketRequest.from_content)(content, self.game)
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
        payload = event.get("data", event.get("payload", {})) or {}
        if not isinstance(payload, dict):
            return

        if "data" not in payload and "game" in payload:
            payload = {"data": {"game": payload["game"]}, **{
                key: value for key, value in payload.items() if key != "game"
            }}

        if not isinstance(payload.get("data"), dict) or "game" not in payload["data"]:
            return

        data = payload.copy()
        data["action"] = "update"

        data["player"] = None
        if self.player and hasattr(self.player, "id"):
            try:
                data["player"] = await database_sync_to_async(get_player_data)(
                    self.player.id
                )
            except Exception:
                data["player"] = None
        await self.send_json(data)

    async def admin_update(self, event):
        payload = event.get("data", event.get("payload", {})) or {}
        if not isinstance(payload, dict):
            return

        if "data" not in payload and "game" in payload:
            payload = {"data": {"game": payload["game"]}, **{
                key: value for key, value in payload.items() if key != "game"
            }}

        if not isinstance(payload.get("data"), dict) or "game" not in payload["data"]:
            return

        data = payload.copy()
        data["action"] = "update"
        data["player"] = None

        await self.send_json(data)
