FROM node:24-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY lib lib

CMD ["npx", "activitypub-bot", "--bots-config-file", "/app/lib/bots.js"]
