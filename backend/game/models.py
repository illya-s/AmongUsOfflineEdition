from django.db import models, transaction
from django.forms.fields import os
from django.utils import timezone

from game.utils import generate_code
from user.models import User


class Location(models.Model):
    name = models.CharField(max_length=255, blank=True, null=False)
    position = models.CharField(max_length=255, blank=True, null=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, null=True)
    updated = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return str(self.name)


class Task(models.Model):
    arduino_id = models.CharField(max_length=64, blank=True, null=True)

    text = models.TextField(max_length=5000, null=False, blank=False)

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, null=True)
    updated = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return f"{self.text}"


def content_file_name(instance, filename):
    _, ext = os.path.splitext(filename)
    return "/".join(["games", instance.code, f"map{ext}"])


class GameRoom(models.Model):
    """Комната, где проходит игра"""

    class Roles(models.TextChoices):
        CREW = "crew", "Член экипажа"
        IMPOSTER = "imposter", "Самозванец"

    code = models.CharField(max_length=8, unique=True, null=False, blank=True)
    name = models.CharField(max_length=255, default="New Game")

    auto_assign_role = models.BooleanField(default=True)

    active = models.BooleanField(default=False, null=False)
    start_time = models.DateTimeField(null=True)
    is_ended = models.BooleanField(default=False, null=False)
    winner = models.CharField(
        max_length=20, choices=Roles.choices, default=None, null=True
    )
    reason = models.CharField(max_length=64, null=True)

    game_map = models.ImageField(upload_to=content_file_name, null=True)

    progress = models.PositiveIntegerField(null=True, blank=True)

    meeting_cooldown_until = models.DateTimeField(null=True, blank=True)
    sabotage_cooldown_until = models.DateTimeField(null=True, blank=True)
    tasks_blocked_until = models.DateTimeField(null=True, blank=True)
    emergency_meetings_blocked_until = models.DateTimeField(null=True, blank=True)
    last_sabotage_type = models.CharField(max_length=50, null=True, blank=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, null=True)
    updated = models.DateTimeField(auto_now=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            field = self._meta.get_field("code")
            self.code = generate_code(length=field.max_length)
        super().save(*args, **kwargs)

    def recalc_progress(self):
        tasks = self.tasks.filter(
            player__is_alive=True,
            player__role=Player.Roles.CREW,
        )

        total = tasks.count()

        if total == 0:
            self.progress = 0
        else:
            completed = tasks.filter(is_completed=True).count()
            self.progress = int((completed / total) * 100)

        self.save(update_fields=["progress"])

    @transaction.atomic
    def reset_game(self):
        """
        Полный сброс состояния игры.
        Можно вызывать перед новым стартом.
        """

        # состояние комнаты
        self.active = False
        self.start_time = None
        self.is_ended = False
        self.winner = None
        self.reason = None
        self.progress = 0

        self.meeting_cooldown_until = None
        self.sabotage_cooldown_until = None
        self.tasks_blocked_until = None
        self.emergency_meetings_blocked_until = None
        self.last_sabotage_type = None

        self.save(
            update_fields=[
                "active",
                "start_time",
                "is_ended",
                "winner",
                "reason",
                "progress",
                "meeting_cooldown_until",
                "sabotage_cooldown_until",
                "tasks_blocked_until",
                "emergency_meetings_blocked_until",
                "last_sabotage_type",
            ]
        )

        # удалить собрания и голоса
        self.meetings.all().delete()

        # сброс игроков
        for player in self.players.all():
            # player.role = None
            player.is_alive = True
            player.cooldown_until = None
            player.kill_cooldown_until = None
            player.save(
                update_fields=[
                    # "role",
                    "is_alive",
                    "cooldown_until",
                    "kill_cooldown_until",
                ]
            )

        # сброс задач
        self.tasks.update(
            is_completed=False,
            completed_at=None,
            player=None,
        )

    def __str__(self):
        return f"{self.name} ({self.code})"


class Player(models.Model):
    class Roles(models.TextChoices):
        CREW = "crew", "Член экипажа"
        IMPOSTER = "imposter", "Самозванец"

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, related_name="players")
    name = models.CharField(max_length=255, null=False, blank=False)

    role = models.CharField(
        max_length=20, choices=Roles.choices, default=None, null=True
    )

    is_alive = models.BooleanField(default=True)

    cooldown_until = models.DateTimeField(
        null=True, blank=True, verbose_name="Перезарядка до"
    )
    kill_cooldown_until = models.DateTimeField(
        null=True, blank=True, verbose_name="Перезарядка убийства до"
    )

    joined_at = models.DateTimeField(auto_now_add=True)

    # Position for Admin Map (0-100 relative to map size)
    # last_location_x = models.FloatField(null=True, blank=True)
    # last_location_y = models.FloatField(null=True, blank=True)

    def is_on_cooldown(self):
        if self.cooldown_until:
            if timezone.now() < self.cooldown_until:
                return True

            self.cooldown_until = None
            self.save(update_fields=["cooldown_until"])

        return False

    def get_remaining_cooldown(self):
        if self.is_on_cooldown():
            delta = self.cooldown_until - timezone.now()
            return max(0, int(delta.total_seconds()))
        return 0

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class GameTask(models.Model):
    room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, related_name="tasks")
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, related_name="room_locations"
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="room_tasks")
    player = models.ForeignKey(
        Player, on_delete=models.SET_NULL, null=True, related_name="tasks"
    )

    points = models.JSONField(null=True)

    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    created = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{str(self.room)} - {str(self.location)}{str(self.task)}"


class ArduinoStation(models.Model):
    """Физическая станция Arduino"""

    uid = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    last_ping = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Station {self.name} ({self.uid})"


class Meeting(models.Model):
    """Собрание игры (экстренное или обнаружение тела)"""

    class MeetingType(models.TextChoices):
        EMERGENCY = "emergency", "Экстренное собрание"
        BODY_REPORT = "body_report", "Обнаружение тела"

    room = models.ForeignKey(
        GameRoom, on_delete=models.CASCADE, related_name="meetings"
    )
    type = models.CharField(
        max_length=20, choices=MeetingType.choices, default=MeetingType.EMERGENCY
    )
    called_by = models.ForeignKey(
        Player, on_delete=models.SET_NULL, null=True, related_name="meetings_called"
    )
    reported_player = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reported_deaths",
        help_text="Игрок, чье тело было обнаружено (только для body_report)",
    )

    started_at = models.DateTimeField(auto_now_add=True)
    duration = models.IntegerField(
        help_text="Длительность собрания в секундах"
    )  # 120 for emergency, 180 for body report
    ended_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_started = models.BooleanField(
        default=False, help_text="Started by admin trigger"
    )

    def __str__(self):
        return f"{self.get_type_display()} - {self.room.code} at {self.started_at}"

    def get_time_remaining(self):
        """Возвращает оставшееся время собрания в секундах"""
        if self.ended_at:
            return 0
        if not self.is_started:
            return self.duration

        elapsed = (timezone.now() - self.started_at).total_seconds()
        remaining = self.duration - elapsed
        return max(0, int(remaining))

    def is_expired(self):
        """Проверяет, истекло ли время собрания"""
        return self.is_started and self.get_time_remaining() == 0


class Vote(models.Model):
    """Голос игрока во время собрания"""

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="votes")
    voter = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="votes_cast"
    )
    voted_for = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="votes_received",
        help_text="Игрок, за которого проголосовали. Null = пропустить голосование",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("meeting", "voter")

    def __str__(self):
        target = self.voted_for.name if self.voted_for else "Skip"
        return f"{self.voter.name} voted for {target}"
