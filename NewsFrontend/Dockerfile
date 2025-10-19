FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Command to start the development server
CMD ["npm", "run", "dev"]
