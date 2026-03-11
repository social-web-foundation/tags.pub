FROM node:24-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY lib lib
COPY web web

CMD ["npx", "activitypub-bot", "--bots-config-file", "/app/lib/bots.js","--index-file", "/app/web/index.html"]
