from django.db import migrations, models


def fill_sequence_numbers(apps, schema_editor):
    GameRoom = apps.get_model("game", "GameRoom")
    GameTask = apps.get_model("game", "GameTask")

    for room_id in GameRoom.objects.values_list("id", flat=True).iterator():
        task_ids = GameTask.objects.filter(room_id=room_id).order_by(
            "task_id", "id"
        ).values_list("id", flat=True)
        for sequence_number, task_id in enumerate(task_ids, start=1):
            GameTask.objects.filter(id=task_id).update(
                sequence_number=sequence_number
            )


class Migration(migrations.Migration):
    dependencies = [
        ("game", "0035_alter_gametask_options_alter_location_options_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="gametask",
            name="sequence_number",
            field=models.PositiveIntegerField(
                blank=True, db_index=True, null=True
            ),
        ),
        migrations.RunPython(fill_sequence_numbers, migrations.RunPython.noop),
        migrations.AlterModelOptions(
            name="gametask",
            options={"ordering": ["sequence_number", "pk"]},
        ),
    ]
