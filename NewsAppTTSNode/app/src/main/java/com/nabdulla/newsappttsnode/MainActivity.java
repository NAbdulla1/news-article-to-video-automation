package com.nabdulla.newsappttsnode;

import android.media.MediaPlayer;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.nabdulla.newsappttsnode.businesslogic.FileSynthesizer;
import com.nabdulla.newsappttsnode.businesslogic.ResultCallback;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity implements TextToSpeech.OnInitListener, ResultCallback {
    private TextToSpeech tts;
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
        tts = new TextToSpeech(this, this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            Locale bengaliBdLocale = Locale.forLanguageTag("bn-BD");
            int result = tts.setLanguage(bengaliBdLocale);
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e("TTS", "Language not supported.");
            } else {
                //synthesizeSpeechToFile("Hello! This is your TTS output.");
                String text = getString(R.string.sample_text_input);
                this.textView.setText("Found bn-BD language");
                List<List<String>> paragraphs = splitTextIntoParagraphs(text, TextToSpeech.getMaxSpeechInputLength());
                //speakParagraphs(paragraphs);
                FileSynthesizer fileSynthesizer = new FileSynthesizer(tts, paragraphs, getExternalFilesDir(null).getAbsolutePath(), this);
                fileSynthesizer.saveToFile();
            }
        } else {
            this.textView.setText("Didn't found bn-BD language");
        }
    }

    @Override
    public void audioFile(String error, File file) {
        if (error != null) {
            Log.e("nf", error);
            return;
        }

        mediaPlayer = new MediaPlayer();
        mediaPlayer.setOnCompletionListener(mp -> {
            mp.release(); // frees memory + audio hardware
            mediaPlayer = null;
        });

        try {
            mediaPlayer.setDataSource(file.getPath());
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private List<List<String>> splitTextIntoParagraphs(String text, int maxLength) {
        List<List<String>> chunks = new ArrayList<>();

        // Split by paragraph markers — you can adjust as needed
        String[] paragraphs = text.split("\\n+");

        StringBuilder currentChunk = new StringBuilder();

        for (String paragraph : paragraphs) {
            if (paragraph.isEmpty()) {
                continue;
            }
            chunks.add(splitParagraphIntoChunks(paragraph, maxLength));
        }

        return chunks;
    }

    public List<String> splitParagraphIntoChunks(String paragraph, int maxLength) {
        List<String> chunks = new ArrayList<>();

        String[] sentences = paragraph.split("(?<=[।!?])"); // Split by Bengali sentence-ending punctuation
        StringBuilder currentChunk = new StringBuilder();

        for (String sentence : sentences) {
            if (currentChunk.length() + sentence.length() > maxLength) {
                chunks.add(currentChunk.toString().trim());
                currentChunk.setLength(0);
            }
            currentChunk.append(sentence).append(" ");
        }

        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }

        super.onDestroy();
    }
}
