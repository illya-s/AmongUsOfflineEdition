import traceback
from dataclasses import dataclass
from typing import Any, Literal

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from game.auth import JWTAuthentication
from game.models import GameRoom, Player
from game.utils import get_game_data, get_player_by_id
from user.models import User


@dataclass(slots=True)
class SocketRequest:
    request_id: str | None
    action: str
    data: dict[str, Any]
    raw: dict[str, Any]
    user: AnonymousUser | User
    player: Player | None
    auth: dict[str, Any] | None
    game: GameRoom
    code: str | None = None

    @classmethod
    def from_content(cls, content: dict[str, Any], game: GameRoom) -> "SocketRequest":
        auth = JWTAuthentication()
        user, payload = auth.authenticate(content)

        player = None
        pId = content.get("player_id")
        if pId:
            player = get_player_by_id(pId)
        print(f"Player: {pId}")

        return cls(
            request_id=content.get("request_id"),
            action=str(content.get("action")),
            data=content.get("data", {}) or {},
            raw=content,
            user=user,
            player=player,
            auth=payload,
            game=game,
        )


@dataclass(slots=True)
class SocketResponse:
    action: str
    request_id: str | None
    data: dict[str, Any] | None = None
    code: str | None = None
    message: str | None = None

    type: Literal["send", "broadcast"] = "broadcast"

    @classmethod
    def from_request(cls, request: SocketRequest):
        return cls(
            action=request.action, request_id=request.request_id, code=request.code
        )

    def to_dict(self) -> dict[str, Any]:
        """Конвертируем в словарь, фильтруя None"""
        result = {
            "action": self.action,
            "request_id": self.request_id,
        }
        if self.data is not None:
            result["data"] = self.data
        if self.code is not None:
            result["code"] = self.code
        if self.message is not None:
            result["message"] = self.message
        return result

    async def send(self, consumer):
        """Отправка через consumer (WebSocket)"""
        await consumer.send_json(self.to_dict())

    async def broadcast(self, consumer):
        """Отправка всем в группе"""
        await consumer.channel_layer.group_send(
            consumer.room_group_name, {"type": "update", "payload": self.to_dict()}
        )


class SocketHandler:
    def __init__(self, consumer):
        self.consumer = consumer

    async def dispatch(self, request: SocketRequest):
        handler = getattr(self, "handle", None)
        if not handler:
            await SocketResponse(
                action="error",
                request_id=request.request_id,
                code="handler_not_found",
                message=f"Обработчик не найден: {request.action}",
            ).send(self.consumer)
            return

        try:
            response = await database_sync_to_async(handler)(request)

            if not isinstance(response, SocketResponse):
                raise RuntimeError("Handler must return SocketResponse")

            if response.type == "broadcast":
                response.data = await database_sync_to_async(get_game_data)(request.game.pk)

            if hasattr(response, response.type):
                await getattr(response, response.type)(self.consumer)
            else:
                raise ValueError(f"Response не имеет метода {response.type}")
        except Exception as e:
            print(traceback.format_exc())
            await self._handle_exception(request.request_id, e)

    async def _send_error(self, request_id: str, code: str, message: str):
        response = SocketResponse(
            action="error", request_id=request_id, code=code, message=message
        )
        await response.send(self.consumer)

    async def _handle_exception(self, request_id: str, exc: Exception):
        from rest_framework.exceptions import ValidationError

        if isinstance(exc, ValidationError):
            response = SocketResponse(
                action="error",
                request_id=request_id,
                code="validation_error",
                message=str(exc.detail) if hasattr(exc, "detail") else str(exc),
            )
            await response.send(self.consumer)
        else:
            await self._send_error(request_id, "internal_error", str(exc))
