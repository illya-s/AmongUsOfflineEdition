from __future__ import absolute_import, unicode_literals

import os

# import backup.tasks
from celery import Celery
from celery.schedules import crontab
# from kombu import Exchange, Queue

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("backend")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.conf.timezone = "Europe/Kyiv"

app.conf.update(
    broker_url=os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0"),
    result_backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/0"),
    broker_connection_retry_on_startup=True,
    # task_queues=(
    #     Queue("hard", Exchange("hard"), routing_key="hard"),
    #     Queue("fast", Exchange("fast"), routing_key="fast"),
    # ),
    # task_default_queue="fast",
    # task_default_exchange="fast",
    # task_default_routing_key="fast",
)

app.autodiscover_tasks()


# app.conf.beat_schedule = {}

app.conf.beat_schedule = {
    # "import-medias-daily": {
    #     "task": "film.tasks.import_medias",
    #     "schedule": crontab(hour=3, minute=15),
    # },
    # "import-genres-monthly": {
    #     "task": "film.tasks.get_genres",
    #     "schedule": crontab(day_of_month=1, hour=2, minute=15),
    # },
}
