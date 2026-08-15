const CATEGORY_COLORS: Record<string, string> = {
  決算: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  技術: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  規制: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "M&A": "bg-teal-500/15 text-teal-300 border-teal-500/30",
  その他: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const IMPORTANCE_DOT: Record<string, string> = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-slate-500",
};

type Article = {
  id: string;
  title: string;
  titleJa?: string | null;
  url: string;
  summary: string | null;
  category: string | null;
  importance: string | null;
  publishedAt: Date;
  source: string;
  companies: { name: string; ticker: string }[];
};

export default function ArticleFeed({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-dash-border bg-dash-surface/90 p-8 text-center text-dash-dim">
        <p>記事がまだありません。RSS収集を実行してください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {articles.map((article) => {
        const category = article.category ?? "その他";
        const importance = article.importance ?? "low";
        const date = new Date(article.publishedAt).toLocaleDateString("ja-JP", {
          month: "short",
          day: "numeric",
        });

        return (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-news flex items-start gap-3 p-3 transition-all group"
          >
            <div className="mt-1.5 shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${IMPORTANCE_DOT[importance] ?? IMPORTANCE_DOT["low"]}`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`text-[12px] px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLORS[category] ?? CATEGORY_COLORS["その他"]}`}
                >
                  {category}
                </span>
                {article.companies.map((c) => (
                  <span
                    key={c.ticker}
                    className="chip-news text-[12px] px-1.5 py-0.5 rounded font-mono"
                  >
                    {c.ticker}
                  </span>
                ))}
              </div>
              <p className="text-sm text-dash-text/90 group-hover:text-white transition-colors font-medium line-clamp-2">
                {article.titleJa || article.title}
              </p>
              {article.summary && (
                <p className="text-xs text-dash-dim mt-0.5 line-clamp-1">
                  {article.summary}
                </p>
              )}
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs text-dash-dim">{date}</p>
              <p className="text-xs text-dash-dim/80 mt-0.5">{article.source}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
