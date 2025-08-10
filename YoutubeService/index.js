require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { consume, ack } = require('./rabbitmq');
const { youtube } = require('./config');

async function main() {
    try {
        console.log(' [*] Waiting for video messages. To exit press CTRL+C');

        await consume(youtube.queue, youtube.inputRoutingKey, async (msg) => {
            if (msg.content) {
                const id = msg.properties.headers.id;
                const headline = msg.properties.headers.headline;
                const videoBuffer = msg.content;

                console.log(` [x] Received video for ${headline} (${id})`);

                const videoPath = path.join('/videos', `${id}.mp4`);
                fs.writeFileSync(videoPath, videoBuffer);

                console.log(` [x] Saved video to ${videoPath}`);

                // In the future, this is where YouTube upload logic would go

                await ack(msg);
                console.log(` [x] Acknowledged message for ${headline} (${id})`);
            }
        });
    } catch (error) {
        console.error("Error in main:", error);
    }
}

main();
