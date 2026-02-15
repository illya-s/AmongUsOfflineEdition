#!/bin/bash

# Остановка скрипта при ошибке
set -e

echo "Waiting for postgres..."

echo "Applying database migrations..."
uv run manage.py migrate

echo "Starting server..."
uv run manage.py runserver 0.0.0.0:8000