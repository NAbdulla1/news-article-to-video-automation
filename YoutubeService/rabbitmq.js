
const amqp = require('amqplib');
const config = require('./config');

let channel = null;

async function connect() {
    if (channel) {
        return channel;
    }

    const connection = await amqp.connect(`amqp://${config.rabbitmq.user}:${config.rabbitmq.pass}@${config.rabbitmq.host}`);
    channel = await connection.createChannel();
    await channel.assertExchange(config.rabbitmq.exchange, 'direct', { durable: true });

    return channel;
}

async function publish(routingKey, message, headers = {}) {
    const ch = await connect();
    ch.publish(config.rabbitmq.exchange, routingKey, Buffer.from(JSON.stringify(message)), { headers });
}

async function consume(queue, routingKey, callback) {
    const ch = await connect();
    await ch.assertQueue(queue, { durable: true });
    await ch.bindQueue(queue, config.rabbitmq.exchange, routingKey);
    ch.consume(queue, callback, { noAck: false });
}

async function ack(msg) {
    if (msg) {
        const ch = await connect();
        ch.ack(msg);
    }
}

module.exports = {
    connect,
    publish,
    consume,
    ack,
};
