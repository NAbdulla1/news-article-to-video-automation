FROM node:20-slim

WORKDIR /app
COPY package.json .

RUN npm install --production && \
    npx playwright install chromium-headless-shell --with-deps

COPY . .

ENV NODE_ENV=production

CMD ["npm", "start"]
