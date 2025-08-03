
import pika
from gtts import gTTS
import io
import os
import time
from pydub import AudioSegment
import json

def main():
    rabbitmq_host = os.environ.get('RABBITMQ_HOST', 'localhost')
    rabbitmq_user = os.environ.get('RABBITMQ_USER', 'news_user')
    rabbitmq_pass = os.environ.get('RABBITMQ_PASS', 'news_password')
    exchange_name = 'news-app-exchange'
    input_routing_key = 'input.tts'
    output_routing_key = 'output.tts'
    queue_name = 'news-article-queue'

    credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=rabbitmq_host, credentials=credentials))
    channel = connection.channel()

    channel.exchange_declare(exchange=exchange_name, exchange_type='direct', durable=True)
    channel.queue_declare(queue=queue_name, durable=True)
    channel.queue_bind(exchange=exchange_name, queue=queue_name, routing_key=input_routing_key)

    def callback(ch, method, properties, body):
        try:
            message = json.loads(body.decode())
            item_id = message.get('id')
            headline = message.get('headline', '')
            content = message.get('content', '')

            print(f" [x] Received {headline} ({item_id})")

            # Create audio for headline
            tts_headline = gTTS(text=headline, lang='bn')
            headline_fp = io.BytesIO()
            tts_headline.write_to_fp(headline_fp)
            headline_fp.seek(0)
            headline_audio = AudioSegment.from_file(headline_fp, format="mp3")

            # Create audio for content
            paragraphs = content.split('\n')
            pause = AudioSegment.silent(duration=500)
            content_audio = AudioSegment.empty()
            for para in paragraphs:
                if para.strip():
                    tts_content = gTTS(text=para, lang='bn')
                    content_fp = io.BytesIO()
                    tts_content.write_to_fp(content_fp)
                    content_fp.seek(0)
                    segment = AudioSegment.from_file(content_fp, format="mp3")
                    content_audio += segment + pause

            # Combine headline and content audio
            combined_audio = headline_audio + pause + content_audio

            final_audio_fp = io.BytesIO()
            combined_audio.export(final_audio_fp, format="mp3")
            final_audio_fp.seek(0)
            audio_bytes = final_audio_fp.read()

            # Publish the audio
            channel.basic_publish(
                exchange=exchange_name,
                routing_key=output_routing_key,
                body=audio_bytes,
                properties=pika.BasicProperties(
                    content_type='audio/mpeg',
                    delivery_mode=2,  # make message persistent
                    headers={'headline': headline, 'id': item_id} # Add headline to headers
                )
            )
            print(f" [x] Sent audio for {headline} ({item_id})")
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print(f" [!] Error processing message: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag)


    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=callback)

    print(' [*] Waiting for messages. To exit press CTRL+C')
    channel.start_consuming()

if __name__ == '__main__':
    while True:
        try:
            main()
        except pika.exceptions.AMQPConnectionError:
            print("Connection lost. Reconnecting in 5 seconds...")
            time.sleep(5)

