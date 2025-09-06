require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { consume, ack } = require('./rabbitmq');
const { youtube } = require('./config');
const logger = require('./logger');

async function main() {
    try {
        logger.info(' [*] Waiting for video messages. To exit press CTRL+C');

        await consume(youtube.queue, youtube.inputRoutingKey, async (msg) => {
            if (msg.content) {
                const id = msg.properties.headers.id;
                const headline = msg.properties.headers.headline;
                const videoBuffer = msg.content;

                logger.info(` [x] Received video for ${headline} (${id})`);

                const videoPath = path.join('/videos', `${id}.mp4`);
                fs.writeFileSync(videoPath, videoBuffer);

                logger.info(` [x] Saved video to ${videoPath}`);

                // In the future, this is where YouTube upload logic would go

                await ack(msg);
                logger.info(` [x] Acknowledged message for ${headline} (${id})`);
            }
        });
    } catch (error) {
        logger.error("Error in main:", error);
    }
}

main();
