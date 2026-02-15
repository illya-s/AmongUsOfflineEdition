from datetime import timedelta

from django.utils import timezone
from rest_framework.serializers import ValidationError

from game.models import GameRoom, GameTask, Player
from game.request import SocketHandler, SocketRequest, SocketResponse
from game.serializers import (
    CompleteTaskSerializer,
    KillPlayerSerializer,
    UpdatePlayerLocationSerializer,
)
from game.utils import check_win_condition, end_game


class CompleteTask(SocketHandler):
    """Handler for marking a task as complete and updating game progress"""

    serializer_class = CompleteTaskSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        task_id = request.data.get("id")

        try:
            task = GameTask.objects.get(id=task_id, room=request.game)
        except GameTask.DoesNotExist:
            raise ValidationError({"id": "Task not found"})

        # Verify the task belongs to the requesting player
        if task.player_id != request.player.id:
            raise ValidationError({"id": "This task does not belong to you"})

        # Check if player is alive
        if not request.player.is_alive:
            raise ValidationError({"player": "Dead players cannot complete tasks"})

        # Check if player is on cooldown
        if request.player.is_on_cooldown():
            remaining = request.player.get_remaining_cooldown()
            raise ValidationError(
                {"cooldown": f"Cooldown active: {remaining} seconds remaining"}
            )

        # Check if tasks are blocked by sabotage
        if (
            request.game.tasks_blocked_until
            and timezone.now() < request.game.tasks_blocked_until
        ):
            raise ValidationError(
                {"sabotage": "Tasks are currently blocked by sabotage"}
            )

        # Mark task as complete
        task.is_completed = True
        task.completed_at = timezone.now()
        task.save(update_fields=["is_completed", "completed_at"])

        # Set cooldown for the player (prevent spam)
        request.player.cooldown_until = timezone.now() + timedelta(minutes=3)
        request.player.save(update_fields=["cooldown_until"])

        check_win_condition(request.game)
        return SocketResponse.from_request(request)


class KillPlayer(SocketHandler):
    """Handler for imposter killing a crew member"""

    serializer_class = KillPlayerSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        target_id = request.data.get("target_id")

        imposter = Player.objects.filter(
            room=request.game, role=Player.Roles.IMPOSTER
        ).first()
        is_moderator = request.player is None

        if not is_moderator:
            if not request.player.is_alive:
                raise ValidationError({"player": "Вы уже мертвы!"})

            if (
                imposter.kill_cooldown_until
                and timezone.now() < imposter.kill_cooldown_until
            ):
                raise ValidationError(
                    {"cooldown": f"Время перезарядки убийства активно"}
                )

        try:
            if not is_moderator:
                target = request.player
            else:
                target = Player.objects.get(id=target_id, room=request.game)
        except Player.DoesNotExist:
            raise ValidationError({"target_id": "Target player not found"})

        if not target.is_alive:
            raise ValidationError({"target": "Target is already dead"})

        target.is_alive = False
        target.save(update_fields=["is_alive"])

        if not is_moderator:
            imposter.kill_cooldown_until = timezone.now() + timedelta(minutes=2)
            imposter.save(update_fields=["kill_cooldown_until"])

        check_win_condition(request.game)
        return SocketResponse.from_request(request)
