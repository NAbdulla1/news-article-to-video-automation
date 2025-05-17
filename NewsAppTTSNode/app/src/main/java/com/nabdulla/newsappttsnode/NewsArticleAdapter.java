package com.nabdulla.newsappttsnode;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
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
            showOtherIcons(holder, this.newsArticles.get(position), View.GONE);
        } else {
            pbProcessing.setVisibility(View.GONE);
            showOtherIcons(holder,this.newsArticles.get(position), View.VISIBLE);
        }
    }

    private void showOtherIcons(NewsArticleViewHolder holder, NewsArticleData newsArticleData, int visible) {
        ImageView ivNotProcessing = holder.itemView.findViewById(R.id.ivNotProcessing);
        ivNotProcessing.setVisibility(visible);

        switch (newsArticleData.getStatus()) {
            case IN_QUEUE:
                ivNotProcessing.setImageResource(android.R.drawable.ic_lock_idle_alarm);
                break;
            case FAILED:
                ivNotProcessing.setImageResource(android.R.drawable.ic_dialog_alert);
                break;
            case SUCCESS:
                ivNotProcessing.setImageResource(android.R.drawable.checkbox_on_background);
        }
    }

    @Override
    public int getItemCount() {
        return newsArticles.size();
    }
}
