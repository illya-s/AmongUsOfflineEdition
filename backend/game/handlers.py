import datetime

from django.utils import timezone
from rest_framework.serializers import ValidationError

from game.models import GameTask, Player
from game.request import SocketHandler, SocketRequest, SocketResponse
from game.serializers import (
    ChangeGameSerializer,
    ChangeMapSerializer,
    ChangePlayerRoleSerializer,
    GameTaskSerializer,
    PlayerSerializer,
    ToggleAutoAssignRoleSerializer,
    UpdateZonesSerializer,
)
from game.utils import format_remaining_time


class ToggleAutoAssignRole(SocketHandler):
    serializer_class = ToggleAutoAssignRoleSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        serializer = self.serializer_class(request.game, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return SocketResponse.from_request(request)


class ChangeGameHandler(SocketHandler):
    serializer_class = ChangeGameSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        serializer = self.serializer_class(request.game, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return SocketResponse.from_request(request)


class AddTask(SocketHandler):
    serializer_class = GameTaskSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        request.data["room"] = request.game.pk

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return SocketResponse.from_request(request)


class ChangeCheckTask(SocketHandler):
    def handle(self, request: SocketRequest) -> SocketResponse:
        task_id = request.data.get("id")
        value = request.data.get("value")

        if not isinstance(value, bool):
            raise ValidationError("value должен быть bool!")

        if value:
            if request.player.is_on_cooldown():
                time_text = format_remaining_time(request.player.cooldown_until)
                raise ValidationError(f"Задание можно изменить через {time_text}")

        updated_count = GameTask.objects.filter(id=task_id).update(
            is_completed=value, completed_at=timezone.now() if value else None
        )
        request.game.recalc_progress()

        if updated_count == 0:
            raise ValidationError("Задача не найдена")

        if value:
            if request.player.role == request.player.Roles.CREW:
                request.player.cooldown_until = timezone.now() + datetime.timedelta(
                    minutes=3
                )
                request.player.save()

        return SocketResponse.from_request(request)


class DeleteTask(SocketHandler):
    def handle(self, request: SocketRequest) -> SocketResponse:
        id = request.data.get("id")
        task = GameTask.objects.filter(id=id)

        if not task.exists():
            raise ValidationError("Игрок не найден")

        task.first().delete()
        return SocketResponse.from_request(request)


class UpdateZones(SocketHandler):
    serializer_class = UpdateZonesSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        id = request.data.get("id")
        task = GameTask.objects.filter(id=id)

        if not task.exists():
            raise ValidationError("Игрок не найден")

        serializer = self.serializer_class(task.first(), data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return SocketResponse.from_request(request)


class AddPlayer(SocketHandler):
    serializer_class = PlayerSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return SocketResponse.from_request(request)


class ChangePlayerRole(SocketHandler):
    serializer_class = ChangePlayerRoleSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        serializer = self.serializer_class(request.game, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return SocketResponse.from_request(request)


class GetPlayerById(SocketHandler):
    serializer_class = PlayerSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        id = request.data.get("id")
        player = Player.objects.filter(id=id).first()

        serializer = self.serializer_class(player)

        return SocketResponse(
            type="send",
            action=request.action,
            request_id=request.request_id,
            data=serializer.data,
            code=request.action,
        )


class DeletePlayer(SocketHandler):
    def handle(self, request: SocketRequest) -> SocketResponse:
        id = request.data.get("id")
        player = Player.objects.filter(id=id)

        if not player.exists():
            raise ValidationError("Игрок не найден")

        player.first().delete()

        return SocketResponse.from_request(request)


class ChangeMap(SocketHandler):
    serializer_class = ChangeMapSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        serializer = self.serializer_class(request.game, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return SocketResponse.from_request(request)
