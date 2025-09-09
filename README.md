# News Article to Video Automation

This project is a collection of services that work together to scrape news articles, convert them to audio, generate videos, and upload them to YouTube.

## Services

### NewsScrapper
A Node.js service responsible for scraping news articles from various sources. It extracts the content of the articles and sends them to a message queue for further processing.

We have added unit testing in this project.

### NewsAppTTSNode
An Android application that provides Text-to-Speech (TTS) functionality. It can be used to convert the text from the scraped news articles into audio.
 - Build and install the app on an Android Device.
 - Install Bengali TTS data from Phone settings.
 - The phone and the computer should be in the same network.
 - Run the app.
 - Click on 'Open Settings' button to connect to the app with RabbitMq
   - Provide the computer IP as RabbitMQ host
   - Provide the RabbitMQ username(default news_user)
   - Provide the RabbitMQ password(default news_password)
   - Provide the RabbitMQ exchange name(default news-app-exchange)
   - Provide the RabbitMQ TTS input queue name(default input.tts)
   - Provide the RabbitMQ TTS output queue name(default output.tts)

It would be good if we could emulate the Android device inside docker. But for now it is only possible for Ubuntu OS.

### NewsTTSPython
A Python service that also provides Text-to-Speech (TTS) functionality. This offers an alternative to the Android-based TTS service. We are not using this service now because it generates very low quality(in terms of Test To Speech) audio. The android TTS is better.

### NewsVideoGenerator
A Node.js service that takes the text and audio from the previous services and generates a video. It generates an image from the news headline and combines the audio with the image to create a video representation of the news article.

### YoutubeService
A Node.js service that uploads the generated videos to YouTube. It listens for messages indicating that a new video is ready and then handles the upload process.

It doesn't upload the video to Youtube for now but it saves the video locally.

### ELK
This directory contains the configuration for an ELK (Elasticsearch, Logstash, Kibana) stack. This is used for collecting, processing, and visualizing logs from all the services in the project.
