from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from game.models import GameRoom
from game.utils import get_game_by_code, get_player_by_id


class PlayerAuthMiddleware:
    """
    Middleware извлекает code из URL и pId из Query-параметров,
    находит игрока/игру в БД и добавляет их в scope.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            url_kwargs = scope.get("url_route", {}).get("kwargs", {})
            room_code = url_kwargs.get("code")

            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)

            pId_raw = query_params.get("pId", [None])[0]
            pId = None if pId_raw in [None, "null", "undefined"] else pId_raw

            game = None
            player = None

            if room_code:
                game = await database_sync_to_async(get_game_by_code)(room_code)

            if not isinstance(game, GameRoom):
                await send({"type": "websocket.accept"})
                await send({ "type": "websocket.close", "code": 4004})
                return

            if pId:
                player = await database_sync_to_async(get_player_by_id)(pId)

            scope["game"] = game
            scope["player"] = player
            scope["is_admin"] = player is None

        return await self.inner(scope, receive, send)
