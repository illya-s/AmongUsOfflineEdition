import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from game.utils import generate_code, get_game_data

from .models import GameRoom, Location, Player, Task
from .serializers import (
    GameRoomSerializer,
    GameTaskSerializer,
    LocationSerializer,
    PlayerSerializer,
    TaskSerializer,
)

logger = logging.getLogger(__name__)


class LocationView(ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        elif self.action in ["create", "update", "partial_update"]:
            permission_classes = [IsAdminUser]
        elif self.action == "destroy":
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TasksView(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        elif self.action in ["create", "update", "partial_update"]:
            permission_classes = [AllowAny]
        elif self.action == "destroy":
            permission_classes = [AllowAny]
        else:
            permission_classes = [AllowAny]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GameRoomView(ModelViewSet):
    queryset = GameRoom.objects.all()
    serializer_class = GameRoomSerializer
    lookup_field = "code"

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        elif self.action in ["create", "update", "partial_update"]:
            permission_classes = [IsAuthenticated]
        elif self.action == "destroy":
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(code=generate_code(length=8), user=self.request.user)


class PlayersView(APIView):
    serializer_class = PlayerSerializer
    permission_classes = [AllowAny]

    def get(self, requset: Request) -> Response:
        serializer = self.serializer_class(Player.objects.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PlayerView(APIView):
    serializer_class = PlayerSerializer
    permission_classes = [AllowAny]

    def get(self, request: Request, pk: int) -> Response:
        player = get_object_or_404(Player, id=pk)
        serializer = self.serializer_class(player)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request: Request, pk: int) -> Response:
        player = get_object_or_404(Player, id=pk)
        name = player.name
        player.delete()
        return Response(
            {"message": f"Пользователь {name} удалён!"}, status=status.HTTP_200_OK
        )


class GameStartToggle(APIView):
    serializer_class = GameRoomSerializer

    def post(self, requset: Request, code: str) -> Response:
        game = get_object_or_404(GameRoom, code=code)

        game.active = not game.active
        game.start_time = timezone.now()
        game.save()

        serializer = self.serializer_class(game)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GamePlayerView(APIView):
    serializer_class = PlayerSerializer
    permission_classes = [AllowAny]

    def post(self, request: Request, code: str) -> Response:
        game = get_object_or_404(GameRoom, code=code)

        serializer = self.serializer_class(
            data={
                "room": game.pk,
                "user": request.user.pk,
                "name": request.data.get("name", f"Player {request.user.pk}"),
            }
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"game_{game.code}",
            {
                "type": "update",
                "action": "update",
                "data": get_game_data(game.id),
            },
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class GamePlayersView(APIView):
    serializer_class = PlayerSerializer
    permission_classes = [AllowAny]

    def get(self, request: Request, code: str) -> Response:
        game = get_object_or_404(GameRoom, code=code)
        serializer = self.serializer_class(game.players.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GameTaskView(APIView):
    serializer_class = GameTaskSerializer
    permission_classes = [AllowAny]

    def get(self, request: Request, code: str) -> Response:
        game = get_object_or_404(GameRoom, code=code)
        serializer = self.serializer_class(game.tasks.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request: Request, code: str) -> Response:
        game = get_object_or_404(GameRoom, code=code)

        serializer = self.serializer_class(
            data={
                "room": game.pk,
                "location": request.data.get("location"),
                "task": request.data.get("task"),
            }
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
