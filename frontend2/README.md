# Frontend 2 (Next.js)

Next.js-версия текущего React-клиента. Исходная папка `frontend` не используется и не изменяется.

## Запуск

```bash
corepack enable
yarn install
PROXY_TARGET=http://localhost:8000 yarn dev
```

Приложение доступно на `http://localhost:3000`. `PROXY_TARGET` задаёт адрес Django-бэкенда для HTTP, media, static и websocket-маршрутов. Для Docker-сети используйте `PROXY_TARGET=http://backend:8000`.

Для production-проверки:

```bash
yarn build
yarn start
```

Публичный базовый адрес API можно переопределить через `NEXT_PUBLIC_API_URL`; по умолчанию используются относительные URL.

## Websocket-тесты

Тестовые настройки используют SQLite и in-memory channel layer, поэтому PostgreSQL и Redis для запуска набора не нужны:

```bash
cd ../backend
DJANGO_SETTINGS_MODULE=config.settings.test uv run python manage.py test game.test_websocket
```
