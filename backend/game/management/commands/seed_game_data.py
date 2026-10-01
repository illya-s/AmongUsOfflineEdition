import random
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from game.models import GameLocation, GameRoom, GameTask, Task


DEFAULT_GAME_CODE = "DEFAULT"
DEFAULT_GAME_NAME = "Дефолтная игра"
MAP_SIZE = {"width": 593, "height": 1143}

# Safe points inside the rooms in map.svg. Several points per room keep task
# markers readable while still scattering them around the map.
LOCATION_POINTS = {
    "Склад": [(238, 92), (294, 105), (340, 151), (246, 224), (324, 275)],
    "Игровая": [(397, 248), (449, 279), (501, 88), (512, 170), (523, 268)],
    "Офис": [(409, 360), (477, 390), (535, 430), (422, 520), (521, 542)],
    "Коридор": [(230, 366), (245, 520), (229, 673), (303, 733), (329, 895)],
    "Командный центр": [
        (411, 671),
        (489, 709),
        (544, 774),
        (432, 867),
        (526, 914),
    ],
    "Коффетерий": [(48, 650), (123, 684), (57, 785), (145, 842), (94, 923)],
    "Улица": [(57, 1021), (132, 1063), (215, 1019), (284, 1082), (336, 1037)],
}

LOCATION_COORDINATES = {
    "Склад": (290, 195),
    "Игровая": (475, 195),
    "Офис": (478, 450),
    "Коридор": (285, 735),
    "Командный центр": (480, 780),
    "Коффетерий": (100, 790),
    "Улица": (185, 1060),
}

# A destination turns a task into a transport task with an arrow.
TASKS = [
    (
        "Командный центр",
        "Перезагрузить систему: включить тумблеры в указанной последовательности.",
    ),
    (
        "Командный центр",
        "Извлечь чипы из контейнера через узкую прорезь, не открывая крышку.",
    ),
    (
        "Командный центр",
        "Синхронизировать время: перевернуть песочные часы и дождаться загрузки.",
    ),
    ("Командный центр", "Дешифровать узел: распутать провода и освободить ключ."),
    (
        "Командный центр",
        "Утилизировать архив: измельчить секретный лист на фрагменты не больше 1×1 см.",
    ),
    ("Игровая", "Замаскировать объект: полностью закрасить контур по цветовой схеме."),
    ("Игровая", "Обслужить экосистему: наполнить автополив до контрольной отметки."),
    ("Игровая", "Собрать пазл и прочитать пароль на обратной стороне."),
    ("Игровая", "Сопоставить термины с определениями на доске."),
    ("Игровая", "Найти пять отличий на изображениях панели управления."),
    (
        "Офис",
        "Доставить важный носитель из Офиса в Коффетерий, не касаясь его руками.",
        "Коффетерий",
    ),
    ("Офис", "Построить устойчивую пирамиду из шести стаканчиков."),
    ("Офис", "Очистить рабочую поверхность до контрольной отметки."),
    ("Офис", "Оформить пять отчётов: поставить дату, время и подпись."),
    ("Коридор", "Соединить штекеры проводов по цветам и восстановить питание."),
    ("Коридор", "Подобрать комбинацию выключателей для контрольной лампы."),
    ("Коридор", "Собрать разбросанный мусор в специальный контейнер."),
    ("Коридор", "Провести шарик через навигационный лабиринт."),
    ("Коридор", "Найти и отсканировать четыре спрятанных QR-кода."),
    ("Склад", "Провести инвентаризацию и разложить предметы по категориям."),
    (
        "Склад",
        "Перенести транспортный контейнер со Склада в Коффетерий, не уронив содержимое.",
        "Коффетерий",
    ),
    ("Склад", "Расставить предметы на полках согласно маркировке."),
    ("Склад", "Герметизировать коробку скотчем крест-накрест."),
    ("Коффетерий", "Поднять теннисный шарик, доливая воду в высокий стакан."),
    ("Коффетерий", "Отсортировать пустые бутылки по высоте."),
    ("Коффетерий", "Разлить жидкость поровну в три маленькие ёмкости."),
    ("Коффетерий", "Собрать многослойный бутерброд в порядке из рецепта."),
    ("Коффетерий", "Собрать аптечку из пяти необходимых предметов."),
    ("Улица", "Доставить экспедиционный рюкзак с Улицы в Командный центр.", "Командный центр"),
    ("Коффетерий", "Вынести пакет с мусором из Коффетерия в уличный контейнер.", "Улица"),
]


class Command(BaseCommand):
    help = "Создаёт карту, 7 локаций, 30 заданий и дефолтную игру"

    def add_arguments(self, parser):
        parser.add_argument(
            "--map",
            dest="map_path",
            type=Path,
            default=Path(settings.BASE_DIR) / "tmp" / "map.svg",
            help="Путь к SVG-карте (по умолчанию backend/tmp/map.svg)",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        map_path = options["map_path"].resolve()
        if not map_path.is_file():
            raise CommandError(f"Файл карты не найден: {map_path}")

        room, created = GameRoom.objects.get_or_create(
            code=DEFAULT_GAME_CODE,
            defaults={"name": DEFAULT_GAME_NAME, "progress": 0},
        )
        if not created:
            room.name = DEFAULT_GAME_NAME
            room.progress = room.progress or 0

        if room.game_map:
            room.game_map.delete(save=False)
        with map_path.open("rb") as map_file:
            room.game_map.save("map.svg", File(map_file), save=False)
        room.save()

        locations = {}
        for name in LOCATION_POINTS:
            x, y = LOCATION_COORDINATES[name]
            location, _ = GameLocation.objects.update_or_create(
                room=room,
                name=name,
                defaults={"x": x, "y": y},
            )
            locations[name] = location

        # A fixed seed makes repeated runs stable while distributing markers.
        randomizer = random.Random(20261001)
        points_by_location = {
            name: randomizer.sample(points, len(points))
            for name, points in LOCATION_POINTS.items()
        }
        point_index = {name: 0 for name in LOCATION_POINTS}

        def next_point(location_name):
            choices = points_by_location[location_name]
            index = point_index[location_name]
            point_index[location_name] += 1
            x, y = choices[index % len(choices)]
            lap = index // len(choices)
            return {"x": x + lap * 9, "y": y + lap * 7}

        seeded_task_ids = []
        for sequence_number, definition in enumerate(TASKS, start=1):
            source_name, text, *destination = definition
            task, _ = Task.objects.get_or_create(text=text)
            seeded_task_ids.append(task.id)

            points = [next_point(source_name)]
            if destination:
                points.append(next_point(destination[0]))

            defaults = {
                "location": locations[source_name],
                "points": points,
                "sequence_number": sequence_number,
                "player": None,
                "is_completed": False,
                "completed_at": None,
            }
            matching_tasks = GameTask.objects.filter(room=room, task=task)
            game_task = matching_tasks.first()
            if game_task:
                matching_tasks.exclude(pk=game_task.pk).delete()
                for field, value in defaults.items():
                    setattr(game_task, field, value)
                game_task.save(update_fields=defaults.keys())
            else:
                GameTask.objects.create(room=room, task=task, **defaults)

        room.tasks.exclude(task_id__in=seeded_task_ids).delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Готово: игра {room.code}, {len(locations)} локаций, "
                f"{room.tasks.count()} заданий, карта {map_path.name}"
            )
        )
