#!/bin/bash

# Остановка скрипта при ошибке
set -e

echo "Waiting for postgres..."

echo "Applying database migrations..."
uv run manage.py migrate

echo "Starting server..."
exec "$@"