package com.nabdulla.newsappttsnode.businesslogic;

import android.speech.tts.TextToSpeech;

import java.util.ArrayList;
import java.util.List;

public class TextToAudioConverter {
    private final TextToSpeech tts;
    private final String outputDir;
    private final int maxLength;
    private final ResultCallback callback;

    public TextToAudioConverter(TextToSpeech tts, String outputDir, ResultCallback callback) {
        this.tts = tts;
        this.outputDir = outputDir;
        this.maxLength = TextToSpeech.getMaxSpeechInputLength();
        this.callback = callback;
    }

    public void convert(String text) {
        List<List<String>> paragraphs = splitTextIntoParagraphs(text);
        FileSynthesizer fileSynthesizer = new FileSynthesizer(tts, paragraphs, outputDir, this.callback);
        fileSynthesizer.saveToFile();
    }

    private List<List<String>> splitTextIntoParagraphs(String text) {
        List<List<String>> chunks = new ArrayList<>();

        // Split by paragraph markers — you can adjust as needed
        String[] paragraphs = text.split("\\n+");

        StringBuilder currentChunk = new StringBuilder();

        for (String paragraph : paragraphs) {
            if (paragraph.isEmpty()) {
                continue;
            }
            chunks.add(splitParagraphIntoChunks(paragraph));
        }

        return chunks;
    }

    public List<String> splitParagraphIntoChunks(String paragraph) {
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
}
