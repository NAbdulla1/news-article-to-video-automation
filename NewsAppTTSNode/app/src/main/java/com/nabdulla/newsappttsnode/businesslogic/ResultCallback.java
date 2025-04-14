package com.nabdulla.newsappttsnode.businesslogic;

import java.io.File;

public interface ResultCallback {
    void audioFile(String error, File file);
}
