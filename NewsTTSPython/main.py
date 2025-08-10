
import pika
from gtts import gTTS
import io
import os
import time
from pydub import AudioSegment
import json

def createAudio(headline, content, item_id):
    # Create audio for headline
    tts_headline = gTTS(text=headline, lang='bn', tld='com.bd')
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
            tts_content = gTTS(text=para, lang='bn', tld='com.bd')
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

    return audio_bytes

def main():
    rabbitmq_host = os.environ.get('RABBITMQ_HOST', 'rabbitmq')
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

            audio_bytes = createAudio(headline, content, item_id)

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

def test_sample():
    headline = "ট্রাম্প-পুতিন বৈঠক নিয়ে জেলেনস্কি বললেন, তাঁরা কিছুই অর্জন করতে পারবেন না"
    content = """যুক্তরাষ্ট্রের প্রেসিডেন্ট ডোনাল্ড ট্রাম্প ও রাশিয়ার প্রেসিডেন্ট ভ্লাদিমির পুতিন সরাসরি বৈঠকে বসবেন। ১৫ আগস্ট যুক্তরাষ্ট্রের আলাস্কা অঙ্গরাজ্যে এ বৈঠক অনুষ্ঠিত হবে। সেখানে রাশিয়া-ইউক্রেন যুদ্ধ বন্ধের লক্ষ্যে আলাপ করবেন শীর্ষ এই নেতারা। গতকাল শুক্রবার বৈঠকের বিষয়টি নিশ্চিত করেছেন ডোনাল্ড ট্রাম্প নিজেই।
২০২২ সালের ফেব্রুয়ারি থেকে রাশিয়া ও ইউক্রেনের মধ্যে যুদ্ধ চলছে। এই যুদ্ধে ইউক্রেনকে বিপুল পরিমাণ অস্ত্র দিয়ে সহায়তা করেছে যুক্তরাষ্ট্র ও দেশটির ইউরোপীয় মিত্ররা। তবে গত জানুয়ারিতে ক্ষমতায় বসার পরই ইউক্রেন যুদ্ধ থামাতে তৎপর হন ট্রাম্প। সম্প্রতি তিনি বলেছিলেন, একটি যুদ্ধবিরতি চুক্তির খুব কাছাকাছি রয়েছে মস্কো ও কিয়েভ।
পরে শুক্রবার পুতিনের সঙ্গে বৈঠকের বিষয়টি হোয়াইট হাউসে সাংবাদিকদের জানান ট্রাম্প। তিনি এ-ও বলেন, ‘দুই পক্ষের ভালোর জন্য কিছু অঞ্চল হাতবদল করা হতে পারে।’ বর্তমানে ইউক্রেনের লুহানস্ক, দোনেৎস্ক, জাপোরিঝঝিয়া ও খেরসন অঞ্চলের বড় অংশ রুশ বাহিনীর দখলে রয়েছে। পুতিন বরাবরই বলে আসছেন, যুদ্ধবিরতি চুক্তির জন্য এই অঞ্চলগুলোর দাবি ছাড়তে হবে ইউক্রেনের।
একটি বিবৃতি দিয়ে ট্রাম্পের সঙ্গে বৈঠকের বিষয়টি নিশ্চিত করেছে ক্রেমলিনও। বিবৃতিতে রুশ প্রেসিডেন্টের সহকারী ইউরি উশাকভ বলেছেন, ইউক্রেন সংকটের দীর্ঘমেয়াদি সমাধানের জন্য বিকল্প বিভিন্ন উপায় নিয়ে আলোচনার ওপর জোর দেবেন পুতিন ও ট্রাম্প। এটি অবশ্যই একটি চ্যালেঞ্জিং প্রক্রিয়া। তবে এই আলোচনায় দুই পক্ষ সক্রিয়ভাবে এবং আগ্রহের সঙ্গে আলোচনা করবে।
"""

    audio_bytes = createAudio(headline, content, item_id=1)
    # Save the audio to a file for testing purposes
    with open('test_audio.mp3', 'wb') as f:
        f.write(audio_bytes)
    print("Audio created and saved as 'test_audio.mp3'.")
    exit(0)

if __name__ == '__main__':
    while True:
        try:
            main()
        except Exception as e:
            print(f" [!] Error: {e}")
            print("Connection lost. Reconnecting in 5 seconds...")
            time.sleep(5)
