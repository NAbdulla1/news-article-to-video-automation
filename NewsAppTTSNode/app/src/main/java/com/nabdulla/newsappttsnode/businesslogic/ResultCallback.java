package com.nabdulla.newsappttsnode.businesslogic;

import java.io.File;
import java.io.IOException;

public interface ResultCallback {
    void audioFile(File file) throws IOException;
    void error(String string);
}
