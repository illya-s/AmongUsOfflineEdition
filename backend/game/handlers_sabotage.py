from datetime import timedelta

from django.utils import timezone
from rest_framework.serializers import ValidationError

from game.models import Player
from game.request import SocketHandler, SocketRequest, SocketResponse
from game.serializers import ResolveSabotageSerializer, TriggerSabotageSerializer


class TriggerSabotage(SocketHandler):
    """Handler for triggering a sabotage by an imposter"""

    serializer_class = TriggerSabotageSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        sabotage_type = request.data.get("type")
        game = request.game

        # Verify player is an imposter and alive
        if request.player.role != Player.Roles.IMPOSTER:
            raise ValidationError({"role": "Only imposters can trigger sabotages"})

        if not request.player.is_alive:
            raise ValidationError({"player": "Dead players cannot trigger sabotages"})

        # Check sabotage cooldown
        if (
            game.sabotage_cooldown_until
            and timezone.now() < game.sabotage_cooldown_until
        ):
            remaining = (game.sabotage_cooldown_until - timezone.now()).total_seconds()
            raise ValidationError(
                {
                    "cooldown": f"Sabotage cooldown active: {int(remaining)} seconds remaining"
                }
            )

        # Apply sabotage effects based on type
        if sabotage_type == "lights":
            # Lights sabotage reduces vision (handled in frontend/logic)
            pass
        elif sabotage_type == "comms":
            # Comms sabotage blocks task list and cameras (handled in frontend/logic)
            pass
        elif sabotage_type == "reactor" or sabotage_type == "o2":
            # Reactor/O2 sabotages block emergency meetings
            game.emergency_meetings_blocked_until = timezone.now() + timedelta(
                seconds=60
            )

        game.last_sabotage_type = sabotage_type
        # Set global sabotage cooldown (e.g. 45 seconds)
        game.sabotage_cooldown_until = timezone.now() + timedelta(seconds=45)
        game.save(
            update_fields=[
                "emergency_meetings_blocked_until",
                "last_sabotage_type",
                "sabotage_cooldown_until",
            ]
        )


        return SocketResponse.from_request(request)


class ResolveSabotage(SocketHandler):
    """Handler for resolving an active sabotage"""

    serializer_class = ResolveSabotageSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        game = request.game

        # Clear sabotage effects
        game.emergency_meetings_blocked_until = None
        game.tasks_blocked_until = None
        game.last_sabotage_type = None
        game.save(
            update_fields=[
                "emergency_meetings_blocked_until",
                "tasks_blocked_until",
                "last_sabotage_type",
            ]
        )


        return SocketResponse.from_request(request)
