export const TIMEOUT = parseInt(process.env.TIMEOUT_MILLISECONDS) || 30000;
export const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://app_db:27017/news-scrapper';
export const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
export const RABBITMQ_USER = process.env.RABBITMQ_USER || 'news_user';
export const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'news_password';
export const RABBITMQ_EXCHANGE = 'news-app-exchange';
export const TTS_INPUT_ROUTING_KEY = 'input.tts';
