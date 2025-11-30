FROM node:20-slim

WORKDIR /app
COPY package.json .

RUN npm install --production && \
    npx playwright install chromium-headless-shell --with-deps

RUN node -e "require('mongodb-memory-server').MongoMemoryServer.create().then(s => s.stop())"

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
