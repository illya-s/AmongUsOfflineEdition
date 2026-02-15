import datetime
import hashlib
from typing import Any


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

# def end_meeting_internal(meeting):
