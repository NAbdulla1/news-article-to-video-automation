package com.nabdulla.newsappttsnode;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class NewsArticleAdapter extends RecyclerView.Adapter<NewsArticleAdapter.NewsArticleViewHolder> {

    public static class NewsArticleViewHolder extends RecyclerView.ViewHolder {
        public NewsArticleViewHolder(View itemView) {
            super(itemView);
        }
    }

    private final List<NewsArticleData> newsArticles;

    public NewsArticleAdapter(List<NewsArticleData> newsArticles) {
        this.newsArticles = newsArticles;
    }

    @NonNull
    @Override
    public NewsArticleViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_news_article, parent, false);
        return new NewsArticleViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull NewsArticleViewHolder holder, int position) {
        TextView tvNewsTitle = holder.itemView.findViewById(R.id.tvNewsTitle);
        TextView tvStatus = holder.itemView.findViewById(R.id.tvStatus);
        ProgressBar pbProcessing = holder.itemView.findViewById(R.id.pbProcessing);

        tvNewsTitle.setText(this.newsArticles.get(position).getArticle().substring(0, 25));
        tvStatus.setText(this.newsArticles.get(position).getStatus().toString());
        if (this.newsArticles.get(position).getStatus() == NewsArticleStatus.PROCESSING) {
            pbProcessing.setVisibility(View.VISIBLE);
        } else {
            pbProcessing.setVisibility(View.GONE);
        }
    }

    @Override
    public int getItemCount() {
        return newsArticles.size();
    }
}
