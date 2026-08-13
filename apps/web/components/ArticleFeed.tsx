const CATEGORY_COLORS: Record<string, string> = {
  決算: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  技術: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  規制: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "M&A": "bg-green-500/20 text-green-300 border-green-500/30",
  その他: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const IMPORTANCE_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-yellow-400",
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
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
            className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
          >
            {/* 重要度ドット */}
            <div className="mt-1.5 shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${IMPORTANCE_DOT[importance] ?? IMPORTANCE_DOT["low"]}`}
              />
            </div>

            {/* 本文 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLORS[category] ?? CATEGORY_COLORS["その他"]}`}
                >
                  {category}
                </span>
                {article.companies.map((c) => (
                  <span
                    key={c.ticker}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono"
                  >
                    {c.ticker}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-200 group-hover:text-white transition-colors font-medium line-clamp-2">
                {article.titleJa || article.title}
              </p>
              {article.summary && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {article.summary}
                </p>
              )}
            </div>

            {/* 日付・ソース */}
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-500">{date}</p>
              <p className="text-xs text-slate-600 mt-0.5">{article.source}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
