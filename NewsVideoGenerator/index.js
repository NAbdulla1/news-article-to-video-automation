
require('dotenv').config();
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { consume, publish } = require('../../shared/rabbitmq');
const { video } = require('../../shared/config');

async function main() {
    try {
        console.log(' [*] Waiting for messages. To exit press CTRL+C');

        await consume(video.queue, video.inputRoutingKey, async (msg) => {
            if (msg.content) {
                const id = msg.properties.headers.id;
                const headline = msg.properties.headers.headline;
                const audio = msg.content;

                console.log(` [x] Received ${headline} (${id})`);

                // Create a temporary file for the audio
                const audioPath = path.join(__dirname, `${id}.mp3`);
                fs.writeFileSync(audioPath, audio);

                // Placeholder for video generation
                const videoPath = path.join(__dirname, `${id}.mp4`);

                // For now, we'll just create a dummy video file
                // In the next step, we'll implement the actual video generation
                await new Promise((resolve, reject) => {
                    ffmpeg()
                        .input(audioPath)
                        .input('color=c=black:s=1280x720:d=5') // Black background, 5 seconds duration
                        .inputFormat('lavfi')
                        .complexFilter([
                            {
                                filter: 'drawtext',
                                options: {
                                    text: headline,
                                    fontsize: 60,
                                    fontcolor: 'white',
                                    x: '(w-text_w)/2',
                                    y: '(h-text_h)/2',
                                    box: 1,
                                    boxcolor: 'black@0.5',
                                    boxborderw: 5
                                }
                            }
                        ])
                        .output(videoPath)
                        .on('end', () => resolve())
                        .on('error', (err) => reject(err))
                        .run();
                });


                console.log(` [x] Generated video for ${headline} (${id})`);

                // Publish the video
                await publish(video.outputRoutingKey, fs.readFileSync(videoPath), {
                    id: id,
                    headline: headline
                });

                console.log(` [x] Sent video for ${headline} (${id})`);

                // Clean up temporary files
                fs.unlinkSync(audioPath);
                fs.unlinkSync(videoPath);

                // channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("Error in main:", error);
    }
}

main();
