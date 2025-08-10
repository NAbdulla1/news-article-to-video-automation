package com.nabdulla.newsappttsnode.businesslogic;

import java.io.File;
import java.io.IOException;

public interface ResultCallback {
    void audioFile(String id, String headline, File file) throws IOException;
    void error(String id, String string);
}
