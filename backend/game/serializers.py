import random
from asyncio.tasks import all_tasks

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from game.exceptions import (
    GameAlreadyStartedError,
    NoImposterAssignedError,
    NotEnoughPlayersError,
    NotEnoughTasksError,
    PlayerRoleNotAssignedError,
    ValidationError,
)
from game.request import SocketRequest
from user.models import User

from .models import GameRoom, GameTask, Location, Player, Task


class ToggleAutoAssignRoleSerializer(serializers.Serializer):
    value = serializers.BooleanField()

    def validate(self, data):
        value = data.get("value", None)

        if value is None or not isinstance(value, bool):
            raise serializers.ValidationError("Требуется знвчение value")
        return data

    def update(self, instance: GameRoom, validated_data):
        value = validated_data["value"]

        if instance.active:
            raise GameAlreadyStartedError(
                "Игра уже запущена. Изменение Ролей недоступно"
            )

        instance.auto_assign_role = value
        instance.save()

        return instance


class ChangeGameSerializer(serializers.Serializer):
    value = serializers.BooleanField()

    def validate(self, data):
        value = data.get("value", None)

        if value is None or not isinstance(value, bool):
            raise serializers.ValidationError("Требуется знвчение value")
        return data

    def update(self, instance: GameRoom, validated_data):
        value = validated_data["value"]

        all_players = instance.players.all()
        all_players_count = all_players.count()

        all_tasks = instance.tasks.all()
        all_tasks_count = all_tasks.count()
        shuffle_tasks = list(all_tasks.order_by("?"))

        if all_players_count <= 3:
            raise NotEnoughPlayersError("Недостаточно игроков для начала игры")

        if all_tasks_count < all_players_count:
            raise NotEnoughTasksError(
                f"Недостаточно задач: найдено {all_tasks_count}, а игроков экипажа {all_players_count}"
            )

        instance.active = value
        instance.start_time = timezone.now()
        instance.save()

        if not instance.active:
            return instance

        if not instance.auto_assign_role:
            if all_players.filter(role__isnull=True).exists():
                raise PlayerRoleNotAssignedError(
                    "Роль игрока необходимо назначить до начала игры"
                )
            if all_players.filter(role=Player.Roles.IMPOSTER).exists() is False:
                raise NoImposterAssignedError(
                    "Для начала игры необходимо назначить как минимум одного самозванца"
                )
        else:
            random_players = list(all_players.order_by("?"))

            if all_players_count <= 6:
                imposters_count = 1
            elif all_players_count <= 9:
                imposters_count = 2
            else:
                imposters_count = 3

            imposters = random_players[:imposters_count]
            crew = random_players[imposters_count:]

            with transaction.atomic():
                for player in imposters:
                    player.role = Player.Roles.IMPOSTER
                    player.save(update_fields=["role"])

                for player in crew:
                    player.role = Player.Roles.CREW
                    player.save(update_fields=["role"])

        with transaction.atomic():
            for index, task in enumerate(shuffle_tasks):
                assigned_player = all_players[index % all_players_count]
                task.player = assigned_player
                task.save(update_fields=["player"])

        return instance


class ChangePlayerRoleSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    value = serializers.ChoiceField(choices=Player.Roles.choices)

    def validate(self, data):
        pk = data.get("id", None)
        if not Player.objects.filter(id=pk).exists():
            raise serializers.ValidationError("Игрок не найден")
        return data

    def update(self, instance: GameRoom, validated_data):
        role = validated_data["value"]
        valid_role = Player.Roles(role) if role else None
        Player.objects.filter(id=validated_data["id"]).update(role=valid_role)

        return instance


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"
        read_only_fields = ("id", "updated", "created")


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("id", "updated", "created")


class PlayerSerializer(serializers.ModelSerializer):
    roleList = serializers.SerializerMethodField(read_only=True)

    def get_roleList(self, obj: Player):
        return [{"value": ch[0], "name": ch[1]} for ch in Player.Roles.choices]

    def validate(self, data):
        request: SocketRequest = self.context.get("request")
        game = request.game
        name = data.get("name")

        if not game:
            raise ValidationError("Ошибка сервера")

        if game.active:
            raise ValidationError("Игра уже стартовала!")

        if not name:
            raise ValidationError('Поле "name" обязательно!')

        if game.players.filter(name=name).exists():
            raise ValidationError("Имя уже занято!")

        return data

    def create(self, validated_data):
        request: SocketRequest = self.context.get("request")
        user = request.user if isinstance(request.user, User) else None
        game = request.game
        name = validated_data["name"]

        return Player.objects.create(user=user, name=name, room=game)

    class Meta:
        model = Player
        fields = "__all__"
        read_only_fields = ("id", "joined_at")
        extra_kwargs = {"room": {"required": False}}


class GameTaskSerializer(serializers.ModelSerializer):
    task = serializers.PrimaryKeyRelatedField(queryset=Task.objects.all())
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all())
    player = serializers.PrimaryKeyRelatedField(queryset=Player.objects.all())

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if instance.task:
            representation["task"] = TaskSerializer(instance.task).data

        if instance.location:
            representation["location"] = LocationSerializer(instance.location).data

        if instance.player:
            representation["player"] = PlayerSerializer(instance.player).data

        return representation

    class Meta:
        model = GameTask
        fields = [
            "id",
            "room",
            "location",
            "task",
            "task_id",
            "player",
            "points",
            "is_completed",
            "created",
        ]


class PersonalDataSerializer(serializers.ModelSerializer):
    # tasks = GameTaskSerializer(many=True, read_only=True)
    tasks = serializers.SerializerMethodField()

    def get_tasks(self, obj):
        tasks = obj.tasks.filter(is_completed=False)
        return GameTaskSerializer(tasks, many=True).data

    class Meta:
        model = Player
        fields = "__all__"
        read_only_fields = ("id", "joined_at")
        extra_kwargs = {"room": {"required": False}}


class UpdateZonesSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    points = serializers.JSONField()

    def validate_points(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Points must be a list.")

        for point in value:
            if not isinstance(point, dict) or "x" not in point or "y" not in point:
                raise serializers.ValidationError(
                    "Each point must be a dict with 'x' and 'y' keys."
                )

            try:
                float(point["x"])
                float(point["y"])
            except TypeError, ValueError:
                raise serializers.ValidationError("Coordinates must be numbers.")

        return value

    def update(self, instance: GameTask, validated_data):
        instance.points = validated_data.get("points", instance.points)
        instance.save()
        return instance


class GameRoomSerializer(serializers.ModelSerializer):
    tasks = GameTaskSerializer(many=True, read_only=True)
    players = PlayerSerializer(many=True, read_only=True)

    game_map = serializers.SerializerMethodField(read_only=True)

    def get_game_map(self, obj: GameRoom):
        return f"{settings.BACKEND_URL}{obj.game_map.url}" if obj.game_map else None

    class Meta:
        model = GameRoom
        fields = "__all__"
        read_only_fields = ("id", "code", "updated", "created")
