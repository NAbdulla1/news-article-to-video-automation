package com.nabdulla.newsappttsnode;

import android.media.MediaPlayer;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

interface ResultCallback {
    void audioFile(File file);
}
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
    public void audioFile(File file) {
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

class SpeechSegment {
    private final String id;
    private final String text;
    private final FileSynthesizer fileSynthesizer;
    private final TextToSpeech tts;
    private final File audioFile;

    public SpeechSegment(String id, String text, TextToSpeech tts, FileSynthesizer fileSynthesizer, String outputDir) {
        this.id = id;
        this.text = text;
        this.tts = tts;
        this.fileSynthesizer = fileSynthesizer;

        audioFile = new File(outputDir, this.id + ".wav");
    }

    public File getAudioFile() {
        return audioFile;
    }

    public boolean isSilence() {
        return text.isEmpty();
    }

    public void synthesizeSpeechToFile() {
        Bundle params = new Bundle();
        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, this.id);

        tts.synthesizeToFile(text, params, this.audioFile, this.id);

        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                fileSynthesizer.audioGenerationStarted(utteranceId);
            }

            @Override
            public void onDone(String utteranceId) {
                try {
                    fileSynthesizer.audioGenerated(utteranceId);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }

            @Override
            public void onError(String utteranceId) {
                fileSynthesizer.audioGenerationFailed(utteranceId);
            }
        });
    }

    public void deleteAudioFile() {
        this.audioFile.delete();
    }
}

class FileSynthesizer {
    private final ResultCallback sendResult;
    private final List<SpeechSegment> speechSegments;
    private final String id;
    private final AtomicInteger speechSegmentIndex;
    private final String outputAudioFile;

    public FileSynthesizer(TextToSpeech tts, List<List<String>> paragraphs, String outputDir, ResultCallback callback) {
        this.id = UUID.randomUUID().toString();
        this.speechSegments = new ArrayList<>();
        this.speechSegmentIndex = new AtomicInteger(0);
        this.outputAudioFile = outputDir + "/" + this.id + ".wav";
        this.sendResult = callback;

        for (int paraIndex = 0; paraIndex < paragraphs.size(); paraIndex++) {
            List<String> chunks = paragraphs.get(paraIndex);
            for (int chunkIndex = 0; chunkIndex < chunks.size(); chunkIndex++) {
                String chunk = chunks.get(chunkIndex);
                speechSegments.add(
                        new SpeechSegment(
                                getSegmentId(),
                                chunk,
                                tts,
                                this,
                                outputDir
                        )
                );
            }

            if (paraIndex != paragraphs.size() - 1) {
                speechSegments.add(
                        new SpeechSegment(
                                getSegmentId(),
                                "",
                                tts,
                                this,
                                outputDir
                        )
                );
            }
        }
    }

    private String getSegmentId() {
        return String.format(Locale.US, "%s-%03d", this.id, speechSegments.size());
    }

    public void speak() {
    }

    public void saveToFile() {
        SpeechSegment speechSegment = this.speechSegments.get(speechSegmentIndex.getAndIncrement());
        while(speechSegment.isSilence()) {
            speechSegment = this.speechSegments.get(speechSegmentIndex.getAndIncrement());
        }
        speechSegment.synthesizeSpeechToFile();
    }

    public void audioGenerationStarted(String speechSegmentId) {

    }

    public void audioGenerated(String speechSegmentId) throws IOException {
        Log.i("nf", "Generated audio for " + speechSegmentId);
        if (this.speechSegmentIndex.get() < this.speechSegments.size()) {
            saveToFile();
        } else {
            Log.i("nf", "finished");
            File outputFile = new File(this.outputAudioFile);
            WavConcatenator.concatenateWavFilesWithSilence(
                    this.speechSegments,
                    outputFile
            );
            cleanFiles();
            this.sendResult.audioFile(outputFile);
        }
    }

    public void audioGenerationFailed(String speechSegmentId) {
        cleanFiles();
        //call callback
    }

    private void mergeAudios() {

    }

    private void cleanFiles() {
        for (SpeechSegment speechSegment : this.speechSegments) {
            speechSegment.deleteAudioFile();
        }
    }
}

class WavConcatenator {

    // Settings (must match input WAVs)
    private static int SAMPLE_RATE = 44100;
    private static final int BITS_PER_SAMPLE = 16;
    private static final int CHANNELS = 1;

    public static void concatenateWavFilesWithSilence(List<SpeechSegment> inputFiles, File outputFile) throws IOException {
        SAMPLE_RATE = readSampleRateFromWav(inputFiles.get(0).getAudioFile());
        ByteArrayOutputStream outputPcm = new ByteArrayOutputStream();

        // 500ms silence = 22050 samples = 44100 bytes (for 16-bit mono)
        int silenceSamples = SAMPLE_RATE / 2; // 500ms
        int bytesPerSample = BITS_PER_SAMPLE / 8;
        byte[] silence = new byte[silenceSamples * bytesPerSample]; // all zeroes

        for (int i = 0; i < inputFiles.size(); i++) {
            if (inputFiles.get(i).isSilence()) {
                outputPcm.write(silence); // add 500ms silence except after last file
            } else {
                File file = inputFiles.get(i).getAudioFile();
                byte[] fileBytes = readAllBytes(file);

                //first 44 bytes are header of wav files
                if (fileBytes.length <= 44) continue; // skip empty or invalid files

                byte[] audioData = Arrays.copyOfRange(fileBytes, 44, fileBytes.length); // strip header
                outputPcm.write(audioData);
            }
        }

        // Write output WAV with header
        byte[] finalPcm = outputPcm.toByteArray();
        writeWavFile(outputFile, finalPcm);
    }

    private static void writeWavFile(File outputFile, byte[] pcmData) throws IOException {
        FileOutputStream out = new FileOutputStream(outputFile);

        int byteRate = WavConcatenator.SAMPLE_RATE * WavConcatenator.CHANNELS * WavConcatenator.BITS_PER_SAMPLE / 8;
        int totalDataLen = pcmData.length + 36;
        int totalAudioLen = pcmData.length;

        ByteBuffer header = ByteBuffer.allocate(44);
        header.order(ByteOrder.LITTLE_ENDIAN);

        header.put("RIFF".getBytes());               // ChunkID
        header.putInt(totalDataLen);                 // ChunkSize
        header.put("WAVE".getBytes());               // Format
        header.put("fmt ".getBytes());               // Subchunk1ID
        header.putInt(16);                           // Subchunk1Size (PCM)
        header.putShort((short) 1);                  // AudioFormat (PCM)
        header.putShort((short) WavConcatenator.CHANNELS);           // NumChannels
        header.putInt(WavConcatenator.SAMPLE_RATE);                   // SampleRate
        header.putInt(byteRate);                     // ByteRate
        header.putShort((short) (WavConcatenator.CHANNELS * WavConcatenator.BITS_PER_SAMPLE / 8)); // BlockAlign
        header.putShort((short) WavConcatenator.BITS_PER_SAMPLE);      // BitsPerSample
        header.put("data".getBytes());               // Subchunk2ID
        header.putInt(totalAudioLen);                // Subchunk2Size

        out.write(header.array());
        out.write(pcmData);
        out.close();
    }

    private static byte[] readAllBytes(File file) throws IOException {
        FileInputStream fis = new FileInputStream(file);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int read;
        while ((read = fis.read(buf)) != -1) {
            baos.write(buf, 0, read);
        }
        fis.close();
        return baos.toByteArray();
    }

    private static int readSampleRateFromWav(File wavFile) throws IOException {
        FileInputStream fis = new FileInputStream(wavFile);
        byte[] header = new byte[44];
        fis.read(header);
        fis.close();

        ByteBuffer buffer = ByteBuffer.wrap(header);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        buffer.position(24); // Sample rate starts at byte 24
        return buffer.getInt();
    }

}
