import logging

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer

from game.request import SocketResponse
from game.utils import reset_expired_timers

logger = logging.getLogger(__name__)


# Tasks
@shared_task
def update(room_id):
    from game.models import GameRoom
    from game.serializers import GameRoomSerializer

    room = GameRoom.objects.filter(id=room_id).first()
    if room is None:
        logger.warning("Celery update task skipped: room_id=%s not found", room_id)
        return

    reset_expired_timers(room)

    channel_layer = get_channel_layer()
    room_group_name = f"game_{room.code}"

    res = SocketResponse(
        action="update",
        request_id="-1",
        data={"game": GameRoomSerializer(room).data},
    )

    async_to_sync(res.broadcast)(
        channel_layer=channel_layer, room_group_name=room_group_name
    )

    return True
