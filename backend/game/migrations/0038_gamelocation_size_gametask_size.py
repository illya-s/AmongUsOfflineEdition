from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("game", "0037_rename_location_gamelocation")]

    operations = [
        migrations.AddField(
            model_name="gamelocation",
            name="size",
            field=models.FloatField(default=1),
        ),
        migrations.AddField(
            model_name="gametask",
            name="size",
            field=models.FloatField(default=1),
        ),
    ]
