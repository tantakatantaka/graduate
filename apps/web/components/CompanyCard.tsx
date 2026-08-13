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
  決算: "bg-purple-500/20 text-purple-300",
  技術: "bg-blue-500/20 text-blue-300",
  規制: "bg-orange-500/20 text-orange-300",
  "M&A": "bg-green-500/20 text-green-300",
  その他: "bg-slate-500/20 text-slate-300",
};

export default function CompanyCard({
  company,
  isMain = false,
}: {
  company: CompanyWithRelations;
  isMain?: boolean;
}) {
  const latestStock = company.stockData[0];
  const previousStock = company.stockData[1];
  const changePercent =
    latestStock && previousStock
      ? ((latestStock.close - previousStock.close) / previousStock.close) * 100
      : null;

  const isPositive = changePercent !== null && changePercent >= 0;
  const articleLimit = isMain ? 5 : 3;

  return (
    <div
      className={`rounded-xl border p-4 hover:border-opacity-80 transition-colors ${
        isMain
          ? "border-blue-500/40 bg-blue-950/20 hover:border-blue-500/60"
          : "border-slate-800 bg-slate-900 hover:border-slate-700"
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          {isMain && (
            <span className="mt-0.5 shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
              顧客
            </span>
          )}
          <div>
            <p className="text-xs text-slate-500 font-mono">{company.ticker}</p>
            <h3 className={`font-semibold text-white ${isMain ? "text-base" : "text-sm"}`}>
              {company.name}
            </h3>
            {company.nameJa && (
              <p className="text-xs text-slate-500">{company.nameJa}</p>
            )}
            {isMain && company.description && (
              <p className="text-xs text-slate-500 mt-0.5">{company.description}</p>
            )}
          </div>
        </div>

        {/* 株価 */}
        {latestStock && (
          <div className="text-right shrink-0">
            <p className={`font-mono text-white ${isMain ? "text-base" : "text-sm"}`}>
              ${latestStock.close.toFixed(2)}
            </p>
            {changePercent !== null && (
              <p
                className={`text-xs font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}
              >
                {isPositive ? "+" : ""}
                {changePercent.toFixed(2)}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* 最新記事 */}
      <div className="space-y-2">
        {company.articles.length === 0 ? (
          <p className="text-xs text-slate-600">記事なし</p>
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
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLOR[ac.article.category] ?? CATEGORY_COLOR["その他"]}`}
                  >
                    {ac.article.category}
                  </span>
                )}
                <p className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors line-clamp-2 leading-relaxed">
                  {ac.article.titleJa || ac.article.title}
                </p>
                {isMain && ac.article.summary && (
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5 hidden sm:block">
                    {ac.article.summary}
                  </p>
                )}
              </div>
            </a>
          ))
        )}
      </div>

      {/* フッター */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-600">
          {company.articles.length}件のニュース
        </span>
        <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
          詳細 →
        </span>
      </div>
    </div>
  );
}
