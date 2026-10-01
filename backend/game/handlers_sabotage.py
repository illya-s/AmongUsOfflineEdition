from datetime import timedelta

from django.utils import timezone
from rest_framework.serializers import ValidationError

from game.models import Player
from game.request import SocketHandler, SocketRequest, SocketResponse
from game.serializers import ResolveSabotageSerializer, TriggerSabotageSerializer
from game.tasks import update


class TriggerSabotage(SocketHandler):
    """Handler for triggering a sabotage by an imposter"""

    serializer_class = TriggerSabotageSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        sabotage_type = request.data.get("type")
        game = request.game
        now = timezone.now()

        if request.player.role != Player.Roles.IMPOSTER:
            raise ValidationError({"role": "Only imposters can trigger sabotages"})

        if not request.player.is_alive:
            raise ValidationError({"player": "Dead players cannot trigger sabotages"})

        if (
            game.sabotage_cooldown_until
            and now < game.sabotage_cooldown_until
        ):
            remaining = (game.sabotage_cooldown_until - now).total_seconds()
            raise ValidationError(
                {
                    "cooldown": f"Sabotage cooldown active: {int(remaining)} seconds remaining"
                }
            )

        if sabotage_type == "lights":
            pass
        elif sabotage_type == "comms":
            t = now + timedelta(seconds=60)
            game.tasks_blocked_until = t
            update.apply_async(args=[request.game.id], eta=t)
        elif sabotage_type == "reactor" or sabotage_type == "o2":
            t = now + timedelta(seconds=90)
            game.emergency_meetings_blocked_until = t
            update.apply_async(args=[request.game.id], eta=t)

        game.last_sabotage_type = sabotage_type
        game.sabotage_cooldown_until = now + timedelta(minutes=3)
        game.save(
            update_fields=[
                "emergency_meetings_blocked_until",
                "tasks_blocked_until",
                "last_sabotage_type",
                "sabotage_cooldown_until",
            ]
        )

        update.apply_async(args=[request.game.id], eta=game.sabotage_cooldown_until)

        return SocketResponse.from_request(request)


class ResolveSabotage(SocketHandler):
    """Handler for resolving an active sabotage"""

    serializer_class = ResolveSabotageSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        game = request.game

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
