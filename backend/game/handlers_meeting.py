import datetime
from datetime import timedelta

from django.utils import timezone
from rest_framework.serializers import ValidationError

from game.models import GameRoom, Meeting, Player, Vote
from game.request import SocketHandler, SocketRequest, SocketResponse
from game.serializers import (
    ReportBodySerializer,
    StartEmergencyMeetingSerializer,
    StartMeetingVoteSerializer,
    SubmitVoteSerializer,
)
from game.tasks import update
from game.utils import end_meeting


class StartEmergencyMeeting(SocketHandler):
    """Handler for starting an emergency meeting"""

    serializer_class = StartEmergencyMeetingSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        game = request.game
        now = timezone.now()

        if request.player and not request.player.is_alive:
            raise ValidationError({"player": "Dead players cannot call meetings"})

        active_meeting = game.meetings.filter(is_active=True).first()
        if active_meeting:
            raise ValidationError({"meeting": "There is already an active meeting"})

        if game.meeting_cooldown_until and now < game.meeting_cooldown_until:
            remaining = (game.meeting_cooldown_until - now).total_seconds()
            raise ValidationError(
                {
                    "cooldown": f"Meeting cooldown active: {int(remaining)} seconds remaining"
                }
            )

        if (
            game.emergency_meetings_blocked_until
            and now < game.emergency_meetings_blocked_until
        ):
            raise ValidationError(
                {"sabotage": "Emergency meetings are blocked by sabotage"}
            )

        Meeting.objects.create(
            room=game,
            type=Meeting.MeetingType.EMERGENCY,
            called_by=request.player,
            duration=30,
        )

        t = now + timedelta(minutes=7)
        game.meeting_cooldown_until = t
        game.save(update_fields=["meeting_cooldown_until"])

        update.apply_async(args=[request.game.pk], eta=t)

        return SocketResponse.from_request(request)


class ReportBody(SocketHandler):
    """Handler for reporting a dead body"""

    serializer_class = ReportBodySerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        game = request.game

        if not request.player.is_alive:
            raise ValidationError({"player": "Dead players cannot report bodies"})

        active_meeting = game.meetings.filter(is_active=True).first()
        if active_meeting:
            raise ValidationError({"meeting": "There is already an active meeting"})

        Meeting.objects.create(
            room=game,
            type=Meeting.MeetingType.BODY_REPORT,
            called_by=request.player,
            duration=30,
        )

        return SocketResponse.from_request(request)


class SubmitVote(SocketHandler):
    """Handler for submitting a vote during a meeting"""

    serializer_class = SubmitVoteSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        meeting_id = request.data.get("meeting_id")
        voted_for_id = request.data.get("voted_for_id")  # None = skip vote

        try:
            meeting = Meeting.objects.get(
                id=meeting_id, room=request.game, is_active=True
            )
        except Meeting.DoesNotExist:
            raise ValidationError({"meeting_id": "Active meeting not found"})

        if not meeting.is_started:
            raise ValidationError(
                {"meeting": "Meeting voting phase has not started yet"}
            )

        if meeting.is_expired():
            raise ValidationError({"meeting": "Meeting time has expired"})

        if not request.player.is_alive:
            raise ValidationError({"player": "Dead players cannot vote"})

        if Vote.objects.filter(meeting=meeting, voter=request.player).exists():
            raise ValidationError({"vote": "You have already voted in this meeting"})

        voted_for = None
        if voted_for_id:
            try:
                voted_for = Player.objects.get(id=voted_for_id, room=request.game)
            except Player.DoesNotExist:
                raise ValidationError({"voted_for_id": "Player not found"})

            if not voted_for.is_alive:
                raise ValidationError({"voted_for": "Cannot vote for dead players"})

        Vote.objects.create(meeting=meeting, voter=request.player, voted_for=voted_for)

        alive_players_count = request.game.players.filter(is_alive=True).count()
        votes_count = meeting.votes.count()

        if votes_count >= alive_players_count:
            end_meeting(request.game, meeting)

        return SocketResponse.from_request(request)


class StartMeetingVote(SocketHandler):
    """Handler for admin to start the voting phase of a meeting"""

    serializer_class = StartMeetingVoteSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        meeting_id = request.data.get("meeting_id")

        try:
            meeting = Meeting.objects.get(
                id=meeting_id, room=request.game, is_active=True
            )
        except Meeting.DoesNotExist:
            raise ValidationError({"meeting_id": "Active meeting not found"})

        if meeting.is_started:
            raise ValidationError({"meeting": "Meeting has already started"})

        now = timezone.now()

        meeting.is_started = True
        meeting.started_at = now
        meeting.save(update_fields=["is_started", "started_at"])

        update.apply_async(
            args=[request.game.pk],
            eta=now + datetime.timedelta(seconds=meeting.duration),
        )

        return SocketResponse.from_request(request)
