import amqp from 'amqplib';
import { RABBITMQ_HOST, RABBITMQ_USER, RABBITMQ_PASS, RABBITMQ_EXCHANGE } from '../config.js';

let channel = null;

async function connect() {
    if (channel) {
        return channel;
    }

    const connection = await amqp.connect(`amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}`);
    channel = await connection.createChannel();
    await channel.assertExchange(RABBITMQ_EXCHANGE, 'direct', { durable: true });

    return channel;
}

async function publish(routingKey, message, headers = {}) {
    const ch = await connect();
    ch.publish(RABBITMQ_EXCHANGE, routingKey, Buffer.from(JSON.stringify(message)), { headers });
}

async function consume(queue, routingKey, callback) {
    const ch = await connect();
    await ch.assertQueue(queue, { durable: true });
    await ch.bindQueue(queue, RABBITMQ_EXCHANGE, routingKey);
    ch.consume(queue, callback, { noAck: false });
}

export {
    connect,
    publish,
    consume,
};