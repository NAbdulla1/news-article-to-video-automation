package com.nabdulla.newsappttsnode.businesslogic;

import android.speech.tts.TextToSpeech;
import android.util.Log;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicInteger;

public class FileSynthesizer {
    private final String id;
    private final String headline;
    private final ResultCallback sendResult;
    private final List<SpeechSegment> speechSegments;
    private final AtomicInteger speechSegmentIndex;
    private final String outputAudioFile;

    public FileSynthesizer(TextToSpeech tts, String headline, List<List<String>> paragraphs, String id, String outputDir, ResultCallback callback) {
        this.id = id;
        this.headline = headline;
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
        while (speechSegment.isSilence()) {
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
            WavMerger.concatenateWavFilesWithSilence(
                    this.speechSegments,
                    outputFile
            );
            cleanFiles();
            this.sendResult.audioFile(this.id, this.headline, outputFile);
        }
    }

    public void audioGenerationFailed(String speechSegmentId) {
        cleanFiles();
        this.sendResult.error(this.id, speechSegmentId);
    }

    private void cleanFiles() {
        for (SpeechSegment speechSegment : this.speechSegments) {
            speechSegment.deleteAudioFile();
        }
    }
}
