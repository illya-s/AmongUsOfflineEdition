import tempfile
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase, override_settings

from game.management.commands.seed_game_data import (
    DEFAULT_GAME_CODE,
    LOCATION_POINTS,
    TASKS,
)
from game.models import GameLocation, GameRoom


class SeedGameDataCommandTest(TestCase):
    def test_creates_idempotent_default_game_with_map_and_tasks(self):
        map_path = Path(__file__).resolve().parents[1] / "tmp" / "map.svg"

        with tempfile.TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                call_command("seed_game_data", map_path=map_path, verbosity=0)
                call_command("seed_game_data", map_path=map_path, verbosity=0)

                room = GameRoom.objects.get(code=DEFAULT_GAME_CODE)
                tasks = list(room.tasks.order_by("id"))

                self.assertEqual(GameRoom.objects.filter(code=DEFAULT_GAME_CODE).count(), 1)
                self.assertEqual(room.name, "Дефолтная игра")
                self.assertEqual(len(tasks), len(TASKS))
                self.assertEqual(
                    GameLocation.objects.filter(
                        room=room, name__in=LOCATION_POINTS
                    ).count(),
                    7,
                )
                self.assertTrue(
                    all(
                        location.x > 0 and location.y > 0
                        for location in room.locations.all()
                    )
                )
                self.assertTrue(room.game_map.name.endswith("map.svg"))
                self.assertTrue(Path(room.game_map.path).is_file())
                self.assertEqual(
                    sum(len(game_task.points) == 2 for game_task in tasks),
                    4,
                )
                self.assertTrue(
                    all(len(game_task.points) in (1, 2) for game_task in tasks)
                )
                self.assertEqual(
                    [game_task.sequence_number for game_task in tasks],
                    list(range(1, 31)),
                )
