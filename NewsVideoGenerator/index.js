require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { consume, publish, ack } = require('./rabbitmq');
const { video, youtube } = require('./config');
const {generateVideo, initializeBrowser} = require('./generateVideo');
const logger = require('./logger');

async function main() {
    try {
        await initializeBrowser();

        logger.info(' [*] Waiting for messages. To exit press CTRL+C');

        await consume(video.queue, video.inputRoutingKey, async (msg) => {
            if (msg.content) {
                const id = msg.properties.headers.id;
                const headline = msg.properties.headers.headline;
                const audio = msg.content;

                logger.info(` [x] Received ${headline} (${id})`);

                // Create a temporary file for the audio
                const audioPath = path.join(__dirname, `${id}.wav`);
                fs.writeFileSync(audioPath, audio);

                // Placeholder for video generation
                const videoPath = path.join(__dirname, `${id}.mp4`);
                const imagePath = path.join(__dirname, `${id}.png`);

                // For now, we'll just create a dummy video file
                // In the next step, we'll implement the actual video generation
                await generateVideo(audioPath, videoPath, headline, imagePath);

                logger.info(` [x] Generated video for ${headline} (${id})`);

                // Publish the video
                await publish(youtube.inputRoutingKey, fs.readFileSync(videoPath), {
                    id: id,
                    headline: headline
                });

                logger.info(` [x] Sent video for ${headline} (${id})`);

                // Clean up temporary files
                fs.unlinkSync(audioPath);
                fs.unlinkSync(videoPath);

                // Acknowledge the message
                await ack(msg);
                logger.info(` [x] acknowledge video for ${headline} (${id})`);
            }
        });
    } catch (error) {
        logger.error("Error in main:", error);
    }
}

main();
