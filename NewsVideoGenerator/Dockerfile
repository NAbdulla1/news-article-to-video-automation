FROM node:20-slim

# 1. Install Chromium dependencies + FFmpeg
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  ffmpeg \
  libx264-dev \
  libfreetype6 \
  libfontconfig1 \
  --no-install-recommends && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Install Node.js dependencies including Puppeteer
COPY package.json ./

# 5. Puppeteer environment (let it download Chromium)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=""

RUN npm install

# 4. Copy the rest of your code
COPY . .

# 6. Run your script
CMD ["npm", "start"]
