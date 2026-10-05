from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("game", "0038_gamelocation_size_gametask_size")]

    operations = [
        migrations.AddField(
            model_name="gamelocation",
            name="rotation",
            field=models.FloatField(default=0),
        ),
    ]
