
module.exports = {
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || 'rabbitmq',
        user: process.env.RABBITMQ_USER || 'news_user',
        pass: process.env.RABBITMQ_PASS || 'news_password',
        exchange: 'news-app-exchange',
    },
    video: {
        inputRoutingKey: 'output.tts',
        outputRoutingKey: 'output.video',
        queue: 'video-generator-queue',
    },
    youtube: {
        inputRoutingKey: 'output.video',
        queue: 'youtube-upload-queue',
    }
};