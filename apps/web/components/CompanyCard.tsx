import { Prisma } from "@prisma/client";

type CompanyWithRelations = Prisma.CompanyGetPayload<{
  include: {
    articles: {
      include: { article: true };
    };
    stockData: true;
  };
}>;

const IMPORTANCE_COLOR: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const CATEGORY_COLOR: Record<string, string> = {
  決算: "bg-amber-500/15 text-amber-300",
  技術: "bg-sky-500/15 text-sky-300",
  規制: "bg-orange-500/15 text-orange-300",
  "M&A": "bg-teal-500/15 text-teal-300",
  その他: "bg-slate-500/15 text-slate-300",
};

/** ダッシュボードで取得している株価の上場市場 */
const MARKET_LABEL: Record<string, string> = {
  AMAT: "NASDAQ",
  TSM: "NYSE (ADR)",
  MU: "NASDAQ",
  KIOXIA: "東証プライム",
  "SONY-SC": "NYSE (親会社)",
  RAPIDUS: "非上場",
};

/** 公式ニュース／リリース一覧（DB未同期時のフォールバック） */
const NEWS_URL_BY_TICKER: Record<string, string> = {
  AMAT: "https://www.appliedmaterials.com/jp/ja/news-and-media/press-releases.html",
  TSM: "https://pr.tsmc.com/japanese/latest-news",
  KIOXIA: "https://www.kioxia.com/ja-jp/news.html",
  RAPIDUS: "https://www.rapidus.inc/news_topics/",
  MU: "https://jp.micron.com/about/press/news",
  "SONY-SC": "https://www.sony-semicon.com/ja/news/index.html",
};

export default function CompanyCard({
  company,
  isMain = false,
  tone = "neutral",
}: {
  company: CompanyWithRelations;
  isMain?: boolean;
  /** 顧客=teal / エンドユーザー=amber */
  tone?: "customer" | "enduser" | "neutral";
}) {
  const newsUrl =
    NEWS_URL_BY_TICKER[company.ticker] ??
    (company as { newsUrl?: string | null }).newsUrl ??
    null;
  const latestStock = company.stockData[0];
  const previousStock = company.stockData[1];
  const changePercent =
    latestStock && previousStock
      ? ((latestStock.close - previousStock.close) / previousStock.close) * 100
      : null;

  const isPositive = changePercent !== null && changePercent >= 0;
  const articleLimit = isMain ? 5 : 3;

  const shell =
    isMain || tone === "customer"
      ? "card-customer"
      : tone === "enduser"
        ? "card-enduser"
        : "border border-dash-border bg-dash-surface/90 rounded-xl";

  const linkColor =
    isMain || tone === "customer"
      ? "link-customer"
      : tone === "enduser"
        ? "link-enduser"
        : "text-dash-accent hover:text-dash-accent-soft";

  const dividerClass =
    isMain || tone === "customer"
      ? "divider-customer"
      : tone === "enduser"
        ? "divider-enduser"
        : "border-dash-border";

  return (
    <div className={`p-4 transition-colors backdrop-blur-sm ${shell}`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          {isMain && (
            <span className="badge-customer mt-0.5 shrink-0 text-xs px-1.5 py-0.5 rounded font-medium">
              顧客
            </span>
          )}
          <div>
            <p className="text-sm text-dash-dim font-mono">{company.ticker}</p>
            <h3 className={`font-semibold text-white ${isMain ? "text-xl" : "text-lg"}`}>
              {company.name}
            </h3>
            {company.nameJa && (
              <p className="text-sm text-dash-muted">{company.nameJa}</p>
            )}
            {isMain && company.description && (
              <p className="text-sm text-dash-dim mt-0.5">{company.description}</p>
            )}
          </div>
        </div>

        {/* 株価 + 上場市場名 */}
        {latestStock ? (
          <div className="text-right shrink-0">
            <p className={`font-mono text-white ${isMain ? "text-xl" : "text-lg"}`}>
              {company.ticker === "KIOXIA"
                ? `¥${Math.round(latestStock.close).toLocaleString("ja-JP")}`
                : `$${latestStock.close.toFixed(2)}`}
            </p>
            {changePercent !== null && (
              <p
                className={`text-sm font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}
              >
                {isPositive ? "+" : ""}
                {changePercent.toFixed(2)}%
              </p>
            )}
            <p className="text-xs text-dash-dim mt-0.5">
              {MARKET_LABEL[company.ticker] ?? ""}
            </p>
          </div>
        ) : (
          <div className="text-right shrink-0">
            <p className="text-xs text-dash-dim">
              {MARKET_LABEL[company.ticker] ?? "—"}
            </p>
          </div>
        )}
      </div>

      {/* 最新記事 */}
      <div className="space-y-2">
        {company.articles.length === 0 ? (
          <p className="text-sm text-dash-dim">記事なし</p>
        ) : (
          company.articles.slice(0, articleLimit).map((ac) => (
            <a
              key={ac.article.id}
              href={ac.article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="flex items-start gap-2">
                {ac.article.category && (
                  <span
                    className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLOR[ac.article.category] ?? CATEGORY_COLOR["その他"]}`}
                  >
                    {ac.article.category}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-dash-muted group-hover:text-dash-text transition-colors line-clamp-2 leading-relaxed">
                    {ac.article.titleJa || ac.article.title}
                  </p>
                  {isMain && ac.article.summary && (
                    <p className="text-sm text-dash-dim line-clamp-1 mt-0.5 hidden sm:block">
                      {ac.article.summary}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))
        )}
      </div>

      {/* フッター */}
      <div className={`mt-3 pt-3 border-t flex items-center justify-between ${dividerClass}`}>
        <span className="text-sm text-dash-dim">
          {company.articles.length}件のニュース
        </span>
        {newsUrl ? (
          <a
            href={newsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm ${linkColor}`}
          >
            ニュースリリース →
          </a>
        ) : (
          <span className={`text-sm opacity-40 ${linkColor}`}>ニュースリリース →</span>
        )}
      </div>
    </div>
  );
}
