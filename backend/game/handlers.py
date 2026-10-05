import datetime

from django.utils import timezone
from rest_framework.serializers import ValidationError

from game.models import GameLocation, GameTask, Player
from game.request import SocketHandler, SocketRequest, SocketResponse
from game.serializers import (
    ChangeGameSerializer,
    ChangeMapSerializer,
    ChangePlayerRoleSerializer,
    GameTaskSerializer,
    GameLocationSerializer,
    PlayerSerializer,
    ToggleAutoAssignRoleSerializer,
    UpdateZonesSerializer,
    UpdateGameLocationSerializer,
    UpdateGameTaskSizeSerializer,
)
from game.utils import check_win_condition, format_remaining_time


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

        serializer = self.serializer_class(
            data=request.data, context={"game": request.game}
        )
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
                time_text = format_remaining_time(
                    request.player.cooldown_until - timezone.now()
                )
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

        check_win_condition(request.game)

        return SocketResponse.from_request(request)


class DeleteTask(SocketHandler):
    def handle(self, request: SocketRequest) -> SocketResponse:
        id = request.data.get("id")
        task = GameTask.objects.filter(id=id, room=request.game)

        if not task.exists():
            raise ValidationError("Задание не найдено")

        task.first().delete()
        for sequence_number, game_task in enumerate(
            request.game.tasks.order_by("sequence_number", "pk"), start=1
        ):
            if game_task.sequence_number != sequence_number:
                GameTask.objects.filter(pk=game_task.pk).update(
                    sequence_number=sequence_number
                )
        return SocketResponse.from_request(request)


class UpdateTaskSize(SocketHandler):
    serializer_class = UpdateGameTaskSizeSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        task = GameTask.objects.filter(
            id=request.data.get("id"), room=request.game
        ).first()
        if not task:
            raise ValidationError("Задание не найдено")
        serializer = self.serializer_class(task, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return SocketResponse.from_request(request)


class AddLocation(SocketHandler):
    serializer_class = GameLocationSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        data = {**request.data, "room": request.game.pk}
        serializer = self.serializer_class(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=None)
        return SocketResponse.from_request(request)


class UpdateLocation(SocketHandler):
    serializer_class = UpdateGameLocationSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        location = GameLocation.objects.filter(
            id=request.data.get("id"), room=request.game
        ).first()
        if not location:
            raise ValidationError("Локация не найдена")
        serializer = self.serializer_class(location, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return SocketResponse.from_request(request)


class DeleteLocation(SocketHandler):
    def handle(self, request: SocketRequest) -> SocketResponse:
        location = GameLocation.objects.filter(
            id=request.data.get("id"), room=request.game
        ).first()
        if not location:
            raise ValidationError("Локация не найдена")
        location.delete()
        return SocketResponse.from_request(request)


class UpdateZones(SocketHandler):
    serializer_class = UpdateZonesSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        id = request.data.get("id")
        task = GameTask.objects.filter(id=id, room=request.game)

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

        if request.game.active:
            check_win_condition(request.game)

        return SocketResponse.from_request(request)


class ChangeMap(SocketHandler):
    serializer_class = ChangeMapSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        serializer = self.serializer_class(request.game, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return SocketResponse.from_request(request)
