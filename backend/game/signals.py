from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import GameRoom, Player
from .serializers import GameRoomSerializer, PlayerSerializer


# @receiver(post_save, sender=GameRoom)
# def game_updated(sender, instance, created, **kwargs):
#     channel_layer = get_channel_layer()
#     group_name = f"game_{instance.code}"

#     data = {
#         "type": "game_update",
#         "game": GameRoomSerializer(instance).data,
#         "players": PlayerSerializer(instance.players.all(), many=True).data
#     }

#     async_to_sync(channel_layer.group_send)(group_name, data)

# @receiver(post_delete, sender=GameRoom)
# def game_deleted(sender, instance, **kwargs):
#     send_event(instance, "deleted")


# @receiver(post_save, sender=Player)
# def player_updated(sender, instance, created, **kwargs):
#     channel_layer = get_channel_layer()
#     group_name = f"game_{instance.room.code}"

#     data = {
#         "type": "player_update",
#         "game": GameRoomSerializer(instance.room).data,
#         "players": PlayerSerializer(instance.room.players.all(), many=True).data
#     }

#     async_to_sync(channel_layer.group_send)(group_name, data)

# @receiver(post_delete, sender=Player)
# def player_deleted(sender, instance, **kwargs):
#     channel_layer = get_channel_layer()
#     group_name = f"game_{instance.room.code}"

#     data = {
#         "type": "player_update",
#         "game": GameRoomSerializer(instance.room).data,
#         "players": PlayerSerializer(instance.room.players.all(), many=True).data
#     }

#     async_to_sync(channel_layer.group_send)(group_name, data)
