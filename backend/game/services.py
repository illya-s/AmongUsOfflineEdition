from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .utils import get_game_data


def broadcast_game_state(game, action="update", extra_data=None):
    """
    Broadcast the current game state to all players in the room.
    """
    channel_layer = get_channel_layer()
    payload = get_game_data(game.id)

    if extra_data:
        payload.update(extra_data)

    # We add the specific trigger action to the payload
    payload["sub_action"] = action

    async_to_sync(channel_layer.group_send)(
        f"game_{game.code}",
        {
            "type": "update",
            "payload": payload,
        },
    )
