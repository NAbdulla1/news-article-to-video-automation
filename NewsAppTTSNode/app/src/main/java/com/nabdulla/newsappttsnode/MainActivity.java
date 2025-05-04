package com.nabdulla.newsappttsnode;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.IBinder;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    private MediaPlayer mediaPlayer;
    private List<NewsArticleData> newsArticles;
    private NewsArticleAdapter newsArticleAdapter;
    private boolean serviceBounded = false;
    private Button btnStartService;

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

        initNewsArticleListView();

        initStartServiceButton();

        initOpenSettingsButton();

        startRabbitMqService();
    }

    private void initOpenSettingsButton() {
        Button btnOpenSettings = findViewById(R.id.btnOpenSettings);
        btnOpenSettings.setOnClickListener(v -> {
            Intent intent = new Intent(this, SettingsActivity.class);
            startActivity(intent);
        });
    }

    private void initStartServiceButton() {
        btnStartService = findViewById(R.id.btnStartService);
        btnStartService.setOnClickListener(v -> startRabbitMqService());
    }

    private void initNewsArticleListView() {
        RecyclerView rvNewsArticles = findViewById(R.id.rvNewsArticles);

        newsArticles = new ArrayList<>();
        newsArticleAdapter = new NewsArticleAdapter(newsArticles);
        rvNewsArticles.setAdapter(newsArticleAdapter);
        rvNewsArticles.setLayoutManager(new LinearLayoutManager(this));
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
                    newsArticleAdapter.notifyItemInserted(newsArticles.size() - 1);
                    updateEmptyListUI();
                }
            } else if (action == NewsArticleAction.STATUS_CHANGED) {
                for (int idx = 0; idx < newsArticles.size(); idx++) {
                    if (newsArticles.get(idx).getId().equals(id)) {
                        newsArticles.get(idx).setStatus(status);
                        newsArticleAdapter.notifyItemChanged(idx);
                        break;
                    }
                }
            }
        }
    };

    private boolean updatedExistingArticleStatus(NewsArticleData newsArticleData) {
        for (int idx = 0; idx < newsArticles.size(); idx++) {
            if (newsArticles.get(idx).getId().equals(newsArticleData.getId())) {
                newsArticles.get(idx).setStatus(newsArticleData.getStatus());
                newsArticleAdapter.notifyItemChanged(idx);
                return true;
            }
        }

        return false;
    }

    private final ServiceConnection rabbitMqServiceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            RabbitMqService.LocalBinder localBinder = (RabbitMqService.LocalBinder) binder;
            RabbitMqService rabbitMqService = localBinder.getService();
            serviceBounded = true;

            int itemCount = newsArticles.size();
            newsArticles.clear();
            newsArticleAdapter.notifyItemRangeRemoved(0, itemCount);

            List<NewsArticleData> rabbitMqServiceExistingArticles = rabbitMqService.getExistingArticles();
            for (NewsArticleData data : rabbitMqServiceExistingArticles) {
                if (!updatedExistingArticleStatus(data)) {
                    newsArticles.add(data);
                    newsArticleAdapter.notifyItemInserted(newsArticles.size() - 1);
                }
            }
            updateEmptyListUI();
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            serviceBounded = false;
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
        if (serviceBounded) {
            unbindService(rabbitMqServiceConnection);
            serviceBounded = false;
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
        TextView statusView = findViewById(R.id.tvServiceStatusText);
        ImageView ivOnlineDot = findViewById(R.id.ivOnlineDot);

        if (isServiceRunning(RabbitMqService.class)) {
            statusView.setVisibility(View.VISIBLE);
            ivOnlineDot.setVisibility(View.VISIBLE);
            btnStartService.setVisibility(View.INVISIBLE);
        } else {
            statusView.setVisibility(View.INVISIBLE);
            ivOnlineDot.setVisibility(View.INVISIBLE);
            btnStartService.setVisibility(View.VISIBLE);
        }
    }

    private void updateEmptyListUI() {
        TextView tvListEmpty = findViewById(R.id.tvListEmpty);
        if (newsArticles.isEmpty()) {
            tvListEmpty.setVisibility(View.VISIBLE);
        } else {
            tvListEmpty.setVisibility(View.GONE);
        }
    }
}
