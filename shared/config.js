
module.exports = {
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || 'localhost',
        user: process.env.RABBITMQ_USER || 'news_user',
        pass: process.env.RABBITMQ_PASS || 'news_password',
        exchange: 'news-app-exchange',
    },
    tts: {
        inputRoutingKey: 'input.tts',
        outputRoutingKey: 'output.tts',
    },
    video: {
        inputRoutingKey: 'output.tts',
        outputRoutingKey: 'output.video',
        queue: 'video-generator-queue',
    }
};