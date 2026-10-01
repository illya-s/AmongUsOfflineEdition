FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY . .

CMD ["yarn", "build"]
