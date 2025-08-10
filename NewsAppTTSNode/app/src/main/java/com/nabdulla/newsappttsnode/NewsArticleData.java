package com.nabdulla.newsappttsnode;

import java.util.UUID;

public class NewsArticleData {
    private final String headline;
    private final String article;
    private final String id;
    private NewsArticleStatus status;

    public NewsArticleData(String id, String headline, String article, NewsArticleStatus status) {
        this.id = id;
        this.headline = headline;
        this.article = article;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public String getHeadline() {
        return this.headline;
    }

    public String getArticle() {
        return article;
    }

    public void setStatus(NewsArticleStatus status) {
        this.status = status;
    }

    public NewsArticleStatus getStatus() {
        return status;
    }
}
