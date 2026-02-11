from django.apps import AppConfig
from django.db.models.signals import post_migrate


def create_default_user(sender, **kwargs):
    from .models import User

    if not User.objects.filter(email="ilaa64536@gmail.com").exists():
        User.objects.create_superuser(
            email="ilaa64536@gmail.com",
            username="admin"
        )
        print("✅ Создан пользователь ilaa64536@gmail.com")

class UserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'user'

    def ready(self):
        post_migrate.connect(create_default_user, sender=self)
