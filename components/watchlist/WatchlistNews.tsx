"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/utils";

export default function WatchlistNews({ news }: WatchlistNewsProps) {
  if (!news || news.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <Newspaper className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">No news available for your watchlist stocks at the moment.</p>
        <p className="text-gray-500 text-xs mt-2">Check back later for updates.</p>
      </div>
    );
  }

  return (
    <div className="watchlist-news">
      {news.map((article) => {
        const articleDate = article.datetime ? new Date(article.datetime * 1000) : null;
        const timeAgo = article.datetime ? formatTimeAgo(article.datetime) : null;

        return (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-item"
          >
            {article.category && (
              <span className="news-tag">
                {article.category.toUpperCase()}
              </span>
            )}
            <h3 className="news-title">
              {article.headline}
            </h3>
            <div className="news-meta">
              {article.source && (
                <span className="mr-3">{article.source}</span>
              )}
              {timeAgo && (
                <span>{timeAgo}</span>
              )}
            </div>
            {article.summary && (
              <p className="news-summary">
                {article.summary}
              </p>
            )}
            <span className="news-cta">
              Read more <ExternalLink className="inline h-3 w-3 ml-1" />
            </span>
          </a>
        );
      })}
    </div>
  );
}

