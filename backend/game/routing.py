from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/game/<str:code>/", consumers.GameConsumer.as_asgi()),
    # path("ws/admin/game/<str:code>/", consumers.AdminGameConsumer.as_asgi()),
]