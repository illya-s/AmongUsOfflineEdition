from django.db import models
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

    code = models.CharField(max_length=8, unique=True, null=False, blank=True)
    name = models.CharField(max_length=255, default="New Game")

    auto_assign_role = models.BooleanField(default=True)

    active = models.BooleanField(default=False, null=False)
    start_time = models.DateTimeField(null=True)

    game_map = models.ImageField(upload_to=content_file_name, null=True)

    progress = models.PositiveIntegerField(null=True, blank=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, null=True)
    updated = models.DateTimeField(auto_now=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            field = self._meta.get_field("code")
            self.code = generate_code(length=field.max_length)
        super().save(*args, **kwargs)

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

    joined_at = models.DateTimeField(auto_now_add=True)

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
