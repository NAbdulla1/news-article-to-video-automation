package com.nabdulla.newsappttsnode;

import java.util.UUID;

public class NewsArticleData {
    private final String article;
    private final String id;
    private NewsArticleStatus status;

    public NewsArticleData(String article) {
        this(UUID.randomUUID().toString(), article, NewsArticleStatus.IN_QUEUE);
    }

    public NewsArticleData(String id, String article, NewsArticleStatus status) {
        this.id = id;
        this.article = article;
        this.status = status;
    }

    public String getId() {
        return id;
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
