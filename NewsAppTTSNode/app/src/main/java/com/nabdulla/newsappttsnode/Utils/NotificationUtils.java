package com.nabdulla.newsappttsnode.Utils;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.nabdulla.newsappttsnode.StopServiceReceiver;

public class NotificationUtils {

    private static final String CHANNEL_ID = "RabbitChannel";
    private static final String CHANNEL_NAME = "RabbitMQ Service";

    public static Notification createForegroundNotification(Context context, String title, String text) {
        NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
        );
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(serviceChannel);
        }

        Intent stopIntent = new Intent(context, StopServiceReceiver.class);
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
                context, 0, stopIntent, PendingIntent.FLAG_IMMUTABLE);

        return new Notification.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setOngoing(true)
                .addAction(android.R.drawable.ic_delete, "Stop", stopPendingIntent)
                .build();
    }
}
