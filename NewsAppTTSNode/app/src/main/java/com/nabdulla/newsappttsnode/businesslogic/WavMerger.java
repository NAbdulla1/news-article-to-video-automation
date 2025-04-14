package com.nabdulla.newsappttsnode.businesslogic;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;

public class WavMerger {
    public static void concatenateWavFilesWithSilence(List<SpeechSegment> inputFiles, File outputFile) throws IOException {
        if (inputFiles.isEmpty()) throw new IllegalArgumentException("No input files.");

        // Read format from the first file
        WavMerger.AudioFormat format = readFormat(inputFiles.get(0).getAudioFile());

        ByteArrayOutputStream finalPcmData = new ByteArrayOutputStream();

        // 500ms silence = 22050 samples = 44100 bytes (for 16-bit mono)
        int silenceSamples = format.sampleRate / 2;
        int bytesPerSample = format.bitsPerSample / 8;
        byte[] silence = new byte[silenceSamples * bytesPerSample * format.channels]; // zero-filled

        for (int i = 0; i < inputFiles.size(); i++) {
            if (inputFiles.get(i).isSilence()) {
                finalPcmData.write(silence);
            } else {
                File file = inputFiles.get(i).getAudioFile();

                // Validate format
                WavMerger.AudioFormat currentFormat = readFormat(file);
                if (!format.equals(currentFormat)) {
                    throw new IOException("Audio format mismatch in file: " + file.getName());
                }

                byte[] pcm = readPcmData(file);
                finalPcmData.write(pcm);
            }
        }

        // Write output WAV with header
        writeWavFile(outputFile, finalPcmData.toByteArray(), format);
    }

    private static void writeWavFile(File outputFile, byte[] pcmData, WavMerger.AudioFormat format) throws IOException {
        FileOutputStream out = new FileOutputStream(outputFile);

        int byteRate = format.sampleRate * format.channels * format.bitsPerSample / 8;
        int totalDataLen = pcmData.length + 36;
        int totalAudioLen = pcmData.length;

        ByteBuffer header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN);

        header.put("RIFF".getBytes());
        header.putInt(totalDataLen);
        header.put("WAVE".getBytes());
        header.put("fmt ".getBytes());
        header.putInt(16); // Subchunk1 size (PCM)
        header.putShort((short) 1); // Audio format = PCM
        header.putShort((short) format.channels);
        header.putInt(format.sampleRate);
        header.putInt(byteRate);
        header.putShort((short) (format.channels * format.bitsPerSample / 8)); // Block align
        header.putShort((short) format.bitsPerSample);
        header.put("data".getBytes());
        header.putInt(totalAudioLen);

        out.write(header.array());
        out.write(pcmData);
        out.close();
    }

    private static byte[] readPcmData(File wavFile) throws IOException {
        FileInputStream fis = new FileInputStream(wavFile);
        fis.skip(44); // Skip WAV header
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int read;
        while ((read = fis.read(buffer)) != -1) {
            baos.write(buffer, 0, read);
        }
        fis.close();

        return baos.toByteArray();
    }

    private static class AudioFormat {
        int sampleRate;
        int bitsPerSample;
        int channels;

        AudioFormat(int rate, int bits, int ch) {
            sampleRate = rate;
            bitsPerSample = bits;
            channels = ch;
        }

        @Override
        public boolean equals(Object obj) {
            if (!(obj instanceof WavMerger.AudioFormat)) return false;
            WavMerger.AudioFormat other = (WavMerger.AudioFormat) obj;
            return this.sampleRate == other.sampleRate &&
                    this.bitsPerSample == other.bitsPerSample &&
                    this.channels == other.channels;
        }
    }

    private static WavMerger.AudioFormat readFormat(File wavFile) throws IOException {
        FileInputStream fis = new FileInputStream(wavFile);
        byte[] header = new byte[44];
        if (fis.read(header) < 44) throw new IOException("Invalid WAV header");
        fis.close();

        ByteBuffer buffer = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN);

        int sampleRate = buffer.getInt(24);
        int bitsPerSample = buffer.getShort(34) & 0xFFFF;
        int channels = buffer.getShort(22) & 0xFFFF;

        return new WavMerger.AudioFormat(sampleRate, bitsPerSample, channels);
    }
}
