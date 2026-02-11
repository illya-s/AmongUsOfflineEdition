from typing import Any

import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser

from game.utils import get_access_token_from_socket
from user.models import AccessToken, User


class JWTAuthentication:
    def authenticate(
        self, content
    ) -> tuple[User | AnonymousUser, dict[str, Any] | None]:
        access_token = get_access_token_from_socket(content)

        if not access_token:
            return AnonymousUser(), None

        payload = self._decode_token(access_token)

        if not payload or "id" not in payload or "user_id" not in payload:
            return AnonymousUser(), None

        token_obj = self._get_access_token(payload)

        if not token_obj or not token_obj.is_valid():
            return AnonymousUser(), None

        return token_obj.user, payload

    def _decode_token(self, token):
        try:
            return jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )
        except jwt.ExpiredSignatureError | jwt.InvalidTokenError:
            return None

    def _get_access_token(self, payload) -> AccessToken | None:
        try:
            return AccessToken.objects.select_related("user").get(
                id=payload.get("id"),
                user_id=payload.get("user_id"),
            )
        except AccessToken.DoesNotExist:
            return None
