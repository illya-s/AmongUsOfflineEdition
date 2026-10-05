from unittest.mock import patch

from django.test import TestCase

from .models import GameRoom
from .tasks import update


class CeleryTaskTestCase(TestCase):
    @patch("game.tasks.reset_expired_timers")
    def test_update_resets_expired_timers_and_broadcasts(self, reset_timers):
        room = GameRoom.objects.create(code="TASK01", name="Task test room")

        self.assertTrue(update(room.id))
        reset_timers.assert_called_once()
        self.assertEqual(reset_timers.call_args.args[0].pk, room.pk)

    def test_update_skips_missing_room(self):
        with self.assertLogs("game.tasks", level="WARNING"):
            self.assertIsNone(update(999999))
