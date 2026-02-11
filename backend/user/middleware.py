from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework import exceptions

from user.auth import JWTAuthentication
from .models import AccessToken, RefreshToken


class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT Middleware for Django Channels
    Async-safe: uses database_sync_to_async for ORM calls
    """

    async def __call__(self, scope, receive, send):
        request = self.get_request(scope)

        authenticator = JWTAuthentication()
        auth = authenticator.authenticate(request)

        if not auth:
            return

        

        return await super().__call__(scope, receive, send)

    def get_request(self, scope):
        """
        Creates a pseudo-request object compatible with DRF authentication
        """

        class DummyRequest:
            def __init__(self, scope):
                self.scope = scope
                self.COOKIES = {}
                self.META = {}

                query_string = parse_qs(scope.get("query_string", b"").decode())
                self.query_params = {k: v[0] for k, v in query_string.items()}

                headers = dict(scope.get("headers", []))
                if b"authorization" in headers:
                    self.META["HTTP_AUTHORIZATION"] = headers[b"authorization"].decode()

                # parse cookies
                cookie_header = headers.get(b"cookie")
                if cookie_header:
                    cookies = {}
                    for cookie in cookie_header.decode().split(";"):
                        key, val = cookie.strip().split("=", 1)
                        cookies[key] = val
                    self.COOKIES = cookies

            @property
            def data(self):
                return self.query_params

        return DummyRequest(scope)
