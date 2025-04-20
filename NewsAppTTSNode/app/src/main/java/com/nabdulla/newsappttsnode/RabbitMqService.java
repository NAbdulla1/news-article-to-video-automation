package com.nabdulla.newsappttsnode;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.util.Log;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.nabdulla.newsappttsnode.Utils.NotificationUtils;
import com.nabdulla.newsappttsnode.businesslogic.ResultCallback;
import com.nabdulla.newsappttsnode.businesslogic.TextToAudioConverter;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Objects;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;

public class RabbitMqService extends Service implements ResultCallback, TextToSpeech.OnInitListener {
    private Thread consumerThread;
    private Channel channel;
    private TextToAudioConverter textToAudioConverter;
    private TextToSpeech tts;
    private final String exchangeName = "news-app-exchange";
    private final AtomicBoolean ttsProcessing = new AtomicBoolean(false);
    private final Queue<String> textQueue = new ConcurrentLinkedQueue<>();

    @Override
    public void onCreate() {
        super.onCreate();
        startForegroundService(); // Notification for foreground service
        this.tts = new TextToSpeech(this, this);
        this.textToAudioConverter = new TextToAudioConverter(
                this.tts,
                Objects.requireNonNull(getExternalFilesDir(null)).toString(),
                this
        );
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            Locale bengaliBdLocale = Locale.forLanguageTag("bn-BD");
            int result = tts.setLanguage(bengaliBdLocale);
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e("nf", "Language not supported.");
            } else {
                this.startRabbitConsumer();
            }
        } else {
            Log.e("nf", "TTS initialization failed.");
        }
    }

    private void startRabbitConsumer() {
        consumerThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    ConnectionFactory factory = new ConnectionFactory();
                    factory.setHost("192.168.10.159");
                    factory.setUsername("news_user");
                    factory.setPassword("news_password");

                    Connection connection = null;
                    try {
                        connection = factory.newConnection();
                        channel = connection.createChannel();

                        channel.exchangeDeclare(exchangeName, "direct", true);

                        String queueName = "news-article-queue";
                        channel.queueDeclare(queueName, true, false, false, null);
                        channel.queueBind(queueName, exchangeName, "input.tts");

                        channel.basicConsume(queueName, true, (consumerTag, delivery) -> {
                            String message = new String(delivery.getBody(), StandardCharsets.UTF_8);

                            Log.d("RabbitMQ", "Received: " + message);

                            Handler mainHandler = new Handler(Looper.getMainLooper());
                            mainHandler.post(() -> {
                                textQueue.add(message);
                                processMessage();
                            });

                        }, consumerTag -> {
                            Log.d("RabbitMQ", "Article TTS Consumer Cancelled: " + consumerTag);
                        });
                    } catch (Exception e) {
                        if (connection != null) {
                            connection.close();
                        }
                        throw e;
                    }

                    // If connection succeeds, stay inside this thread until failure
                    while (connection.isOpen() && !Thread.currentThread().isInterrupted()) {
                        Thread.sleep(1000);
                    }

                } catch (Exception e) {
                    Log.e("RabbitMQ", "Connection failed, retrying in 5 seconds", e);
                    try {
                        Thread.sleep(5000); // Wait before reconnecting
                    } catch (InterruptedException ex) {
                        break; // Exit loop if service is stopped
                    }
                }
            }
        });
        consumerThread.start();
    }

    private void processMessage() {
        if (ttsProcessing.get()) {
            Log.i("nf", "Already processing, returning early");
            return;
        }

        ttsProcessing.set(true);
        String text = textQueue.poll();
        if (text == null) {
            Log.i("nf", "finished processing queue items");
            ttsProcessing.set(false);
            return;
        }
        Intent intent = new Intent("TTS_PROCESS_STATUS");
        intent.putExtra("status", "started");
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
        this.textToAudioConverter.convert(text);
    }

    private void startForegroundService() {
        Notification notification = NotificationUtils.createForegroundNotification(
                this,
                "TTS Listener Running",
                "Listening for text messages..."
        );
        startForeground(1, notification);
    }


    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
        if (consumerThread != null && consumerThread.isAlive()) {
            consumerThread.interrupt();
        }
        try {
            if (channel != null) {
                channel.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void audioFile(File file) throws IOException {
        /*Intent intent = new Intent("TTS_PROCESS_STATUS");
        intent.putExtra("status", "done");
        intent.putExtra("filePath", file.getAbsolutePath());
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
*/
        byte[] audioBytes = readFileToBytes(file);

        AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
                .contentType("audio/wav")
                .deliveryMode(2) // persistent
                .build();

        channel.basicPublish(
                exchangeName,
                "output.tts",
                props,
                audioBytes
        );

        Log.i("nf", "a message processed");
        ttsProcessing.set(false);
        try {
            Thread.sleep(5000);
            processMessage();
        } catch(Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void error(String speechSegmentId) {
        Log.i("nf", "a message got error while processing");
        ttsProcessing.set(false);
        processMessage();
        //TODO
    }

    public byte[] readFileToBytes(File file) throws IOException {
        FileInputStream fis = new FileInputStream(file);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int read;
        while ((read = fis.read(buffer)) != -1) {
            bos.write(buffer, 0, read);
        }
        fis.close();
        return bos.toByteArray();
    }
}