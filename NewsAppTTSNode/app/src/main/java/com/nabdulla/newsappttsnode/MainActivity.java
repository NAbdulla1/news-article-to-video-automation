package com.nabdulla.newsappttsnode;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.graphics.Color;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.IBinder;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import java.io.IOException;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    private MediaPlayer mediaPlayer;
    private Button btnStartService;
    private List<NewsArticleData> newsArticles; // TODO Use it to show a list
    RabbitMqService rabbitMqService;
    boolean bound = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

//        Intent serviceIntent = new Intent(this, RabbitMqService.class);
//        ContextCompat.startForegroundService(this, serviceIntent);
        startRabbitMqService();

        btnStartService = findViewById(R.id.btnStartService);
        btnStartService.setOnClickListener(v -> startRabbitMqService());
    }

    private final BroadcastReceiver newsListReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            NewsArticleAction action = (NewsArticleAction) intent.getSerializableExtra("action");

            String id = intent.getStringExtra("id");
            NewsArticleStatus status = (NewsArticleStatus) intent.getSerializableExtra("status");

            if (action == NewsArticleAction.ADDED) {
                NewsArticleData newsArticleData = new NewsArticleData(
                        id,
                        intent.getStringExtra("content"),
                        status
                );

                if (!updatedExistingArticleStatus(newsArticleData)) {
                    newsArticles.add(newsArticleData);
                }
            } else if (action == NewsArticleAction.STATUS_CHANGED) {
                for (NewsArticleData data : newsArticles) {
                    if (data.getId().equals(id)) {
                        data.setStatus(status);
                        break;
                    }
                }
            }
            //TODO update ui
        }
    };

    private boolean updatedExistingArticleStatus(NewsArticleData newsArticleData) {
        for (NewsArticleData data : newsArticles) {
            if (data.getId().equals(newsArticleData.getId())) {
                data.setStatus(newsArticleData.getStatus());
                return true;
            }
        }

        return false;
    }

    private final ServiceConnection rabbitMqServiceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            RabbitMqService.LocalBinder localBinder = (RabbitMqService.LocalBinder) binder;
            rabbitMqService = localBinder.getService();
            bound = true;

            List<NewsArticleData> rabbitMqServiceExistingArticles = rabbitMqService.getExistingArticles();
            for (NewsArticleData data : rabbitMqServiceExistingArticles) {
                if (!updatedExistingArticleStatus(data)) {
                    newsArticles.add(data);
                }
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            bound = false;
        }
    };

    @Override
    protected void onStart() {
        super.onStart();
        Intent intent = new Intent(this, RabbitMqService.class);
        bindService(intent, rabbitMqServiceConnection, Context.BIND_AUTO_CREATE);
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (bound) {
            unbindService(rabbitMqServiceConnection);
            bound = false;
        }
    }

    public void play(String filePath) {
        stopAndReleaseMediaPlayer(mediaPlayer != null && mediaPlayer.isPlaying());

        mediaPlayer = new MediaPlayer();
        mediaPlayer.setOnCompletionListener(mp -> {
            mp.release(); // frees memory + audio hardware
            mediaPlayer = null;
        });

        try {
            mediaPlayer.setDataSource(filePath);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        startRabbitMqService();

        LocalBroadcastManager.getInstance(this)
                .registerReceiver(newsListReceiver, new IntentFilter("TTS_NEWS_LIST"));
    }

    private void startRabbitMqService() {
        if (!isServiceRunning(RabbitMqService.class)) {
            Intent serviceIntent = new Intent(this, RabbitMqService.class);
            ContextCompat.startForegroundService(this, serviceIntent);
        }

        updateServiceStatusUI();
    }

    @Override
    protected void onPause() {
        super.onPause();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(newsListReceiver);
    }

    @Override
    protected void onDestroy() {
        stopAndReleaseMediaPlayer(mediaPlayer != null);

        super.onDestroy();
    }

    private void stopAndReleaseMediaPlayer(boolean isPlayer) {
        if (isPlayer) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }

    private boolean isServiceRunning(Class<?> serviceClass) {
        ActivityManager manager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
            if (serviceClass.getName().equals(service.service.getClassName())) {
                return true;
            }
        }
        return false;
    }

    private void updateServiceStatusUI() {
        TextView statusView = findViewById(R.id.serviceStatusText);
        boolean running = isServiceRunning(RabbitMqService.class);

        if (running) {
            statusView.setText("Service Running");
            statusView.setTextColor(Color.GREEN);
        } else {
            statusView.setText("Service Stopped");
            statusView.setTextColor(Color.RED);
        }
    }
}
