import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from game.utils import generate_code, get_game_data

from .models import GameLocation, GameRoom, Player, Task
from .serializers import (
    GameRoomSerializer,
    GameTaskSerializer,
    GameLocationSerializer,
    PlayerSerializer,
    TaskSerializer,
)

logger = logging.getLogger(__name__)


def health(request):
    return JsonResponse({"status": "ok"})


class GameLocationView(ModelViewSet):
    queryset = GameLocation.objects.select_related("room").all()
    serializer_class = GameLocationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        room = self.request.query_params.get("room")
        return queryset.filter(room_id=room) if room else queryset

    def perform_create(self, serializer):
        serializer.save(user=None)


class TasksView(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        serializer.save(user=None)


class GameRoomView(ModelViewSet):
    queryset = GameRoom.objects.all()
    serializer_class = GameRoomSerializer
    lookup_field = "code"

    def perform_create(self, serializer):
        serializer.save(code=generate_code(length=8), user=None)


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
                "user": request.user.pk if request.user else None,
                "name": request.data.get("name"),
            },
            context={"game": game},
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
