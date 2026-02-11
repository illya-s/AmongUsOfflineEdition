FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Сборка для SSR
RUN npm run build

EXPOSE 5173

# Запуск SSR сервера (команда зависит от вашего скрипта в package.json, например 'node server.js')
CMD ["npm", "run", "serve"]