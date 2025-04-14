package com.nabdulla.newsappttsnode.businesslogic;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.io.File;
import java.io.IOException;

public class SpeechSegment {
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
