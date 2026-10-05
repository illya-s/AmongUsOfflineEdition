from django.db import migrations, models


def migrate_font_size(apps, schema_editor):
    GameLocation = apps.get_model("game", "GameLocation")
    for location in GameLocation.objects.all().only("id", "size"):
        GameLocation.objects.filter(pk=location.pk).update(
            font_size=13 * location.size
        )


class Migration(migrations.Migration):
    dependencies = [("game", "0039_gamelocation_rotation")]

    operations = [
        migrations.AddField(
            model_name="gamelocation",
            name="font_size",
            field=models.FloatField(default=13),
        ),
        migrations.AddField(
            model_name="gamelocation",
            name="letter_spacing",
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name="gamelocation",
            name="line_height",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="gamelocation",
            name="text_align",
            field=models.CharField(default="center", max_length=10),
        ),
        migrations.AddField(
            model_name="gamelocation",
            name="vertical_align",
            field=models.CharField(default="middle", max_length=10),
        ),
        migrations.RunPython(migrate_font_size, migrations.RunPython.noop),
    ]
