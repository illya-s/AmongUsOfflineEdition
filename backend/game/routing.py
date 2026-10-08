from game.middleware import PlayerAuthMiddleware
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/game/<str:code>/", PlayerAuthMiddleware(consumers.GameConsumer.as_asgi())),
]