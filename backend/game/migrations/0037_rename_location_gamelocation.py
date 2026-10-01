import re

import django.db.models.deletion
from django.db import migrations, models


def split_locations_by_game(apps, schema_editor):
    GameLocation = apps.get_model("game", "GameLocation")
    GameTask = apps.get_model("game", "GameTask")

    for location in list(GameLocation.objects.all()):
        room_ids = list(
            GameTask.objects.filter(location_id=location.id)
            .order_by()
            .values_list("room_id", flat=True)
            .distinct()
        )
        if not room_ids:
            location.delete()
            continue

        match = re.search(
            r":\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$",
            location.position or "",
        )
        x, y = (float(match.group(1)), float(match.group(2))) if match else (0, 0)

        location.room_id = room_ids[0]
        location.x = x
        location.y = y
        location.save(update_fields=["room", "x", "y"])

        for room_id in room_ids[1:]:
            copy = GameLocation.objects.create(
                name=location.name,
                position=location.position,
                room_id=room_id,
                x=x,
                y=y,
                user_id=location.user_id,
            )
            GameTask.objects.filter(
                room_id=room_id, location_id=location.id
            ).update(location_id=copy.id)


class Migration(migrations.Migration):
    dependencies = [("game", "0036_gametask_sequence_number")]

    operations = [
        migrations.RenameModel(
            old_name="Location",
            new_name="GameLocation",
        ),
        migrations.AddField(
            model_name="gamelocation",
            name="room",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="locations",
                to="game.gameroom",
            ),
        ),
        migrations.AddField(
            model_name="gamelocation",
            name="x",
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name="gamelocation",
            name="y",
            field=models.FloatField(default=0),
        ),
        migrations.RunPython(split_locations_by_game, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="gamelocation",
            name="position",
        ),
        migrations.AlterField(
            model_name="gamelocation",
            name="room",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="locations",
                to="game.gameroom",
            ),
        ),
        migrations.AlterField(
            model_name="gametask",
            name="location",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="tasks",
                to="game.gamelocation",
            ),
        ),
        migrations.AddConstraint(
            model_name="gamelocation",
            constraint=models.UniqueConstraint(
                fields=("room", "name"),
                name="unique_location_name_per_game",
            ),
        ),
    ]
