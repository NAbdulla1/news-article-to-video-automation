package com.nabdulla.newsappttsnode;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import java.io.IOException;

public class MainActivity extends AppCompatActivity {
    private TextView textView;
    private MediaPlayer mediaPlayer;

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

        textView = findViewById(R.id.info);

        Intent serviceIntent = new Intent(this, RabbitMqService.class);
        ContextCompat.startForegroundService(this, serviceIntent);
    }

    private final BroadcastReceiver ttsStatusReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String status = intent.getStringExtra("status");
            String filePath = intent.getStringExtra("filePath");

            Toast.makeText(context, "Audio file status: " + status, Toast.LENGTH_LONG).show();
            if (filePath != null) {
                play(filePath);
            }
        }
    };

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
        LocalBroadcastManager.getInstance(this).registerReceiver(ttsStatusReceiver,
                new IntentFilter("TTS_PROCESS_STATUS"));
    }

    @Override
    protected void onPause() {
        super.onPause();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(ttsStatusReceiver);
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
}
