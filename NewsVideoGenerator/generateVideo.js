const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const Mutex = require('async-mutex').Mutex;
const mutex = new Mutex(); // Limit concurrent video generation
const fontPath = path.resolve(__dirname, 'fonts', 'SolaimanLipi.ttf');
const fontData = fs.readFileSync(fontPath).toString('base64');

let browser, page;

module.exports.initializeBrowser = async function initializeBrowser() {
  console.log("🔄 Initializing browser...");
  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
}

async function generateImageFromText(imagePath, text) {
  await page.setContent(`
  <style>
    @font-face {
      font-family: 'SolaimanLipi';
      src: url(data:font/ttf;base64,${fontData}) format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    body {
      font-family: 'SolaimanLipi', sans-serif;
      font-size: 48px;
      color: white;
      background-color: black;
      margin: 0;
      padding: 40px;
      white-space: pre-wrap;
    }
  </style>
  <div style="margin: 0 auto;">${text}</div>
  `);

  await page.screenshot({ path: imagePath });
  console.log("✅ Image created:", imagePath);
}

function createVideoFromImageAndAudio(imagePath, audioPath, videoPath) {
  return new Promise((resolve, reject) => {
    console.log(`🎬 Creating video from ${videoPath}`);
    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1']) // loop image continuously
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-tune stillimage',
        '-c:a aac',
        '-b:a 192k',
        '-pix_fmt yuv420p',
        '-shortest' // stop video when audio ends
      ])
      .output(videoPath)
      .on('end', () => {
        console.log("✅ Video created:", videoPath);
        resolve();
      })
      .on('error', (err) => {
        console.error("❌ FFmpeg error:", err);
        reject(err);
      })
      .run();
  });
}

module.exports.generateVideo = async function generateVideo(audioPath, videoPath, headline, imagePath) {
  try {
    await mutex.runExclusive(async () => {
      // Generate image from text
      await generateImageFromText(imagePath, headline);

      // Create video from image and audio
      await createVideoFromImageAndAudio(imagePath, audioPath, videoPath);
      await fs.promises.unlink(imagePath); // Clean up the image file
    });
  } catch (error) {
    console.error("❌ Error in video generation:", error);
  }
}

module.exports.closeBrowser = async function closeBrowser() {
  await browser.close();
  console.log("✅ Browser closed");
};
