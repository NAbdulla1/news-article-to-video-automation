
export default {
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || 'rabbitmq',
        user: process.env.RABBITMQ_USER || 'news_user',
        pass: process.env.RABBITMQ_PASS || 'news_password',
        exchange: 'news-app-exchange',
    },
    tts: {
        inputRoutingKey: 'input.tts',
        outputRoutingKey: 'output.tts',
    },
    timeout: parseInt(process.env.TIMEOUT_MILLISECONDS) || 30000,
    databaseUrl: process.env.DATABASE_URL || 'mongodb://app_db:27017/news-scrapper'
};