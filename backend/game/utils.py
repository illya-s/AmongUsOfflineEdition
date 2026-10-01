import datetime
import hashlib
from collections import Counter
from typing import Any

from django.db.models import Q
from django.utils import timezone


def generate_code(length=6):
    hash = hashlib.md5(datetime.datetime.now().isoformat().encode()).hexdigest()
    return hash[:length].upper()


def format_remaining_time(td: datetime.timedelta) -> str:
    total_seconds = max(0, int(td.total_seconds()))
    minutes = total_seconds // 60
    seconds = total_seconds % 60

    if minutes and seconds:
        return f"{minutes} мин {seconds} сек"
    if minutes:
        return f"{minutes} мин"
    return f"{seconds} сек"


def get_game_by_code(code: str):
    from .models import GameRoom

    return GameRoom.objects.filter(code=code).first()


def get_access_token_from_socket(content: dict[str, Any]):
    token = content.get("access_token")

    if not token:
        return None

    return token


def get_game_data(game_id):
    from .models import GameRoom
    from .serializers import GameRoomSerializer

    return {
        "game": GameRoomSerializer(GameRoom.objects.get(id=game_id)).data,
    }


def get_player_by_id(player_id):
    from .models import Player

    return Player.objects.filter(id=player_id).first()


def get_player_data(player_id):
    from .models import Player
    from .serializers import PersonalDataSerializer

    return PersonalDataSerializer(Player.objects.get(id=player_id)).data


def reset_expired_timers(room):
    now = timezone.now()
    room_updated = False
    room_fields_to_update = []

    # 1. Список полей комнаты для проверки (DateTime fields)
    timer_fields = [
        "meeting_cooldown_until",
        "sabotage_cooldown_until",
        "tasks_blocked_until",
        "emergency_meetings_blocked_until",
    ]

    for field in timer_fields:
        val = getattr(room, field)
        if val and val <= now:
            setattr(room, field, None)
            room_fields_to_update.append(field)
            room_updated = True

    # 2. Специфическая логика для типа саботажа
    if not room.tasks_blocked_until and not room.sabotage_cooldown_until:
        if room.last_sabotage_type:
            room.last_sabotage_type = None
            room_fields_to_update.append("last_sabotage_type")
            room_updated = True

    # Сохраняем комнату, если были изменения
    if room_updated:
        room.save(update_fields=room_fields_to_update)

    # 3. Сброс кулдаунов у игроков этой комнаты
    expired_players = room.players.filter(
        Q(cooldown_until__lte=now) | Q(kill_cooldown_until__lte=now)
    )

    for player in expired_players:
        player_updated = False
        p_fields = []

        if player.cooldown_until and player.cooldown_until <= now:
            player.cooldown_until = None
            p_fields.append("cooldown_until")
            player_updated = True

        if player.kill_cooldown_until and player.kill_cooldown_until <= now:
            player.kill_cooldown_until = None
            p_fields.append("kill_cooldown_until")
            player_updated = True

        if player_updated:
            player.save(update_fields=p_fields)
            room_updated = True

    # 4. Сброс meetings
    active_meetings = room.meetings.filter(is_active=True, is_started=True)
    expired_ids = []

    for meeting in active_meetings:
        if meeting.is_expired():
            end_meeting(room, meeting)
            expired_ids.append(meeting.id)

    if expired_ids:
        room_updated = True

    return room_updated


def end_game(game, winner, reason):
    game.is_ended = True
    game.winner = winner
    game.reason = reason
    game.save(update_fields=["is_ended", "winner", "reason"])


def check_win_condition(game):
    from .models import GameRoom, Player

    game.recalc_progress()

    alive_players = game.players.filter(is_alive=True)
    alive_crew = alive_players.filter(role=Player.Roles.CREW).count()
    alive_imposters = alive_players.filter(role=Player.Roles.IMPOSTER).count()

    if alive_imposters >= alive_crew:
        end_game(game, GameRoom.Roles.IMPOSTER, "outnumbered_crew")
    elif alive_imposters == 0:
        end_game(game, GameRoom.Roles.CREW, "all_imposters_ejected")
    elif game.progress == 100:
        end_game(game, GameRoom.Roles.CREW, "all_tasks_completed")


def end_meeting(game, meeting):
    from .models import Player

    """End the meeting and tally votes"""
    votes = meeting.votes.filter(voted_for__isnull=False)
    vote_counts = Counter(vote.voted_for_id for vote in votes)

    if vote_counts:
        max_votes = max(vote_counts.values())
        players_with_max_votes = [
            player_id for player_id, count in vote_counts.items() if count == max_votes
        ]

        if len(players_with_max_votes) == 1:
            ejected_player = Player.objects.get(id=players_with_max_votes[0])
            ejected_player.is_alive = False
            ejected_player.save(update_fields=["is_alive"])

            check_win_condition(game)

    meeting.is_active = False
    meeting.ended_at = timezone.now()
    meeting.save(update_fields=["is_active", "ended_at"])
