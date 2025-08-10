package com.nabdulla.newsappttsnode;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Binder;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.gson.Gson;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    private final Queue<NewsArticleData> textQueue = new ConcurrentLinkedQueue<>();
    private final IBinder binder = new LocalBinder();
    private SharedPreferences prefs;
    private boolean isMqRunning;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = this.getSharedPreferences("RabbitMQPrefs", Context.MODE_PRIVATE);
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

    public class LocalBinder extends Binder {
        public RabbitMqService getService() {
            return RabbitMqService.this;
        }
    }

    public List<NewsArticleData> getExistingArticles() {
        List<NewsArticleData> articles = new ArrayList<>();
        for (NewsArticleData data : textQueue) {
            articles.add(new NewsArticleData(
                    data.getId(),
                    data.getHeadline(),
                    data.getArticle(),
                    data.getStatus()
            ));
        }

        return articles;
    }

    public boolean isMqRunning() {
        return this.isMqRunning;
    }

    private void startRabbitConsumer() {
        consumerThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    String host = prefs.getString("host", "192.168.10.159");
                    String username = prefs.getString("username", "news_user");
                    String password = prefs.getString("password", "news_password");
                    String exchange = prefs.getString("exchange", "news-app-exchange");
                    String inputRoutingKey = prefs.getString("input_routing_key", "input.tts");

                    ConnectionFactory factory = new ConnectionFactory();
                    factory.setHost(host);
                    factory.setUsername(username);
                    factory.setPassword(password);

                    Connection connection = null;
                    try {
                        connection = factory.newConnection();
                        channel = connection.createChannel();

                        channel.exchangeDeclare(exchange, "direct", true);

                        String queueName = "news-article-queue";
                        channel.queueDeclare(queueName, true, false, false, null);
                        channel.queueBind(queueName, exchange, inputRoutingKey);

                        channel.basicConsume(queueName, true, (consumerTag, delivery) -> {
                            String message = new String(delivery.getBody(), StandardCharsets.UTF_8);

                            Gson gson = new Gson();
                            Map<String, Object> articleData = gson.fromJson(message, Map.class);

                            String content = (String)articleData.get("content");
                            String headline = (String)articleData.get("headline");
                            String id = (String)articleData.get("id");

                            Log.d("RabbitMQ", "Received: " + message);

                            Handler mainHandler = new Handler(Looper.getMainLooper());
                            mainHandler.post(() -> {
                                NewsArticleData newsArticleData = new NewsArticleData(id, headline, content, NewsArticleStatus.IN_QUEUE);
                                textQueue.add(newsArticleData);
                                broadcastArticleInfo(
                                        newsArticleData.getId(),
                                        newsArticleData.getHeadline(),
                                        newsArticleData.getArticle(),
                                        newsArticleData.getStatus(),
                                        BroadcastAction.NEWS_ARTICLE_ADDED
                                );
                                processMessage();
                            });

                        }, consumerTag -> {
                            Log.d("RabbitMQ", "Article TTS Consumer Cancelled: " + consumerTag);
                        });
                        broadcastMqStatus(true);
                    } catch (Exception e) {
                        if (connection != null) {
                            connection.close();
                        }
                        broadcastMqStatus(false);
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

    private void broadcastMqStatus(boolean running) {
        this.isMqRunning = running;
        Intent intent = new Intent("MQ_SERVICE_UPDATE");
        intent.putExtra("running", running);
        intent.putExtra("action", BroadcastAction.RABBITMQ_STATUS_CHANGED);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

    private void broadcastArticleInfo(String id, String headline, String content, NewsArticleStatus status, BroadcastAction action) {
        Intent intent = new Intent("MQ_SERVICE_UPDATE");
        intent.putExtra("id", id);
        intent.putExtra("headline", headline);
        intent.putExtra("content", content);
        intent.putExtra("status", status);
        intent.putExtra("action", action);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

    private void processMessage() {
        if (ttsProcessing.get()) {
            Log.i("nf", "Already processing, returning early");
            return;
        }

        ttsProcessing.set(true);
        NewsArticleData newsArticle = textQueue.peek();
        if (newsArticle == null) {
            Log.i("nf", "finished processing queue items");
            ttsProcessing.set(false);
            return;
        }
        newsArticle.setStatus(NewsArticleStatus.PROCESSING);
        broadcastArticleInfo(
                newsArticle.getId(),
                newsArticle.getHeadline(),
                newsArticle.getArticle(),
                newsArticle.getStatus(),
                BroadcastAction.NEWS_ARTICLE_STATUS_CHANGED
        );
        this.textToAudioConverter.convert(newsArticle);
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

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void audioFile(String id, String headline, File file) throws IOException {
        String exchange = prefs.getString("exchange", "news-app-exchange");
        String outputRoutingKey = prefs.getString("output_routing_key", "output.tts");

        broadcastArticleInfo(id, "", "", NewsArticleStatus.SUCCESS, BroadcastAction.NEWS_ARTICLE_STATUS_CHANGED);
        byte[] audioBytes = readFileToBytes(file);

        AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
                .contentType("audio/wav")
                .deliveryMode(2) // persistent
                .headers(new HashMap<>(){{
                    put("headline", headline);
                    put("id", id);
                }})
                .build();

        channel.basicPublish(
                exchange,
                outputRoutingKey,
                props,
                audioBytes
        );

        Log.i("nf", "a message processed");
        ttsProcessing.set(false);
        processNext(false);
    }

    @Override
    public void error(String id, String speechSegmentId) {
        broadcastArticleInfo(id, "", "", NewsArticleStatus.FAILED, BroadcastAction.NEWS_ARTICLE_STATUS_CHANGED);
        Log.i("nf", "a message got error while processing");
        ttsProcessing.set(false);
        processNext(true);
    }

    private void processNext(boolean isFailed) {
        NewsArticleData lastArticleData = textQueue.poll();
        if (isFailed) {
            if (lastArticleData != null) {
                lastArticleData.setStatus(NewsArticleStatus.IN_QUEUE);
                broadcastArticleInfo(
                        lastArticleData.getId(),
                        lastArticleData.getHeadline(),
                        lastArticleData.getArticle(),
                        lastArticleData.getStatus(),
                        BroadcastAction.NEWS_ARTICLE_ADDED
                );
                textQueue.add(lastArticleData);
            }
        }

        try {
            Thread.sleep(5000);
            processMessage();
        } catch (Exception e) {
            e.printStackTrace();
        }
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