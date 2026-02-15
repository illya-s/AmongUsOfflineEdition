from collections import Counter
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
from game.utils import check_win_condition, end_game


class StartEmergencyMeeting(SocketHandler):
    """Handler for starting an emergency meeting"""

    serializer_class = StartEmergencyMeetingSerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        game = request.game

        # Check if player is alive
        if not request.player.is_alive:
            raise ValidationError({"player": "Dead players cannot call meetings"})

        # Check if there's already an active meeting
        active_meeting = game.meetings.filter(is_active=True).first()
        if active_meeting:
            raise ValidationError({"meeting": "There is already an active meeting"})

        # Check meeting cooldown (4 minutes)
        if game.meeting_cooldown_until and timezone.now() < game.meeting_cooldown_until:
            remaining = (game.meeting_cooldown_until - timezone.now()).total_seconds()
            raise ValidationError(
                {
                    "cooldown": f"Meeting cooldown active: {int(remaining)} seconds remaining"
                }
            )

        # Check if emergency meetings are blocked by sabotage
        if (
            game.emergency_meetings_blocked_until
            and timezone.now() < game.emergency_meetings_blocked_until
        ):
            raise ValidationError(
                {"sabotage": "Emergency meetings are blocked by sabotage"}
            )

        # Create the meeting (2 minute duration for emergency)
        Meeting.objects.create(
            room=game,
            type=Meeting.MeetingType.EMERGENCY,
            called_by=request.player,
            duration=120,  # 2 minutes
        )

        # Set cooldown (4 minutes)
        game.meeting_cooldown_until = timezone.now() + timedelta(minutes=4)
        game.save(update_fields=["meeting_cooldown_until"])

        return SocketResponse.from_request(request)


class ReportBody(SocketHandler):
    """Handler for reporting a dead body"""

    serializer_class = ReportBodySerializer

    def handle(self, request: SocketRequest) -> SocketResponse:
        reported_player_id = request.data.get("reported_player_id")
        game = request.game

        if not request.player.is_alive:
            raise ValidationError({"player": "Dead players cannot report bodies"})

        active_meeting = game.meetings.filter(is_active=True).first()
        if active_meeting:
            raise ValidationError({"meeting": "There is already an active meeting"})

        try:
            reported_player = Player.objects.get(id=reported_player_id, room=game)
        except Player.DoesNotExist:
            raise ValidationError({"reported_player_id": "Player not found"})

        if reported_player.is_alive:
            raise ValidationError({"reported_player": "Player is not dead"})

        Meeting.objects.create(
            room=game,
            type=Meeting.MeetingType.BODY_REPORT,
            called_by=request.player,
            reported_player=reported_player,
            duration=60,
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
            self._end_meeting(meeting)

        return SocketResponse.from_request(request)

    def _end_meeting(self, meeting):
        """End the meeting and tally votes"""
        EndMeeting(self.consumer).end_meeting_internal(meeting)


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

        meeting.is_started = True
        meeting.started_at = timezone.now()
        meeting.save(update_fields=["is_started", "started_at"])

        return SocketResponse.from_request(request)


class EndMeeting(SocketHandler):
    """Handler for ending a meeting (called automatically when time expires or all votes are in)"""

    def handle(self, request: SocketRequest) -> SocketResponse:
        meeting_id = request.data.get("meeting_id")

        try:
            meeting = Meeting.objects.get(
                id=meeting_id, room=request.game, is_active=True
            )
        except Meeting.DoesNotExist:
            raise ValidationError({"meeting_id": "Active meeting not found"})

        self.end_meeting_internal(request.game, meeting)
        return SocketResponse.from_request(request)

    def end_meeting_internal(self, game: GameRoom, meeting):
        """Internal method to end meeting and tally votes"""
        votes = meeting.votes.filter(voted_for__isnull=False)
        vote_counts = Counter(vote.voted_for_id for vote in votes)

        if vote_counts:
            max_votes = max(vote_counts.values())
            players_with_max_votes = [
                player_id
                for player_id, count in vote_counts.items()
                if count == max_votes
            ]

            if len(players_with_max_votes) == 1:
                ejected_player = Player.objects.get(id=players_with_max_votes[0])
                ejected_player.is_alive = False
                ejected_player.save(update_fields=["is_alive"])

                check_win_condition(game)

        meeting.is_active = False
        meeting.ended_at = timezone.now()
        meeting.save(update_fields=["is_active", "ended_at"])
