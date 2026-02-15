# Используем официальный образ Python 3.14 (slim для уменьшения размера)
FROM python:3.14-slim-bookworm

# Устанавливаем uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Настройки Python и uv
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Сначала копируем только файлы зависимостей для эффективного кэширования слоев
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    uv sync --frozen --no-install-project --no-dev

# Копируем остальной код
COPY . .

# Синхронизируем проект (устанавливаем сам пакет приложения, если нужно)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Добавляем виртуальное окружение в PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV DJANGO_SETTINGS_MODULE=config.settings.prod

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8000

# Запуск через uv run для надежности
# CMD ["uv", "run", "manage.py", "runserver", "0.0.0.0:8000"]
