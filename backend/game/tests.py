from unittest.mock import patch

from django.test import TestCase, override_settings

from .tasks import task


class CeleryTaskTestCase(TestCase):
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_task_execution_logic(self):
        """Проверяем, что логика внутри задачи работает (Unit Test)"""
        with self.assertLogs("game.tasks", level="INFO") as cm:
            task.delay()  # Вызываем через .delay(), но из-за EAGER она выполнится сразу
            self.assertIn("First task", cm.output[0])

    def test_task_routing(self):
        """Проверяем, что задача отправляется в правильную очередь (Integration Test)"""
        with patch("game.tasks.task.apply_async") as mock_apply:
            task.delay()

            args, kwargs = mock_apply.call_args
            self.assertEqual(kwargs.get("queue"), "fast")
