"use client";

import { useState } from "react";
import { DailySnapshot } from "@prisma/client";

type CompanySnapshot = {
  ticker: string;
  name: string;
  nameJa: string | null;
  articleCount: number;
  stockClose: number | null;
  stockChange: number | null;
  topArticles: { title: string; url: string; category: string | null }[];
};

type TopArticle = {
  title: string;
  url: string;
  category: string | null;
  importance: string | null;
  source: string;
  companies: string[];
};

const IMPORTANCE_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-yellow-400",
  low: "bg-slate-500",
};

const CATEGORY_COLORS: Record<string, string> = {
  決算: "bg-purple-500/20 text-purple-300",
  技術: "bg-blue-500/20 text-blue-300",
  規制: "bg-orange-500/20 text-orange-300",
  "M&A": "bg-green-500/20 text-green-300",
  その他: "bg-slate-500/20 text-slate-400",
};

export default function SnapshotCard({ snapshot }: { snapshot: DailySnapshot }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(snapshot.date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const companies = snapshot.companies as CompanySnapshot[];
  const topArticles = snapshot.topArticles as TopArticle[];

  const activeCompanies = companies.filter((c) => c.articleCount > 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* ヘッダー */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-white">{date}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {snapshot.articleCount}件の記事を収集
            </p>
          </div>
          {/* 企業別記事数バッジ */}
          <div className="hidden sm:flex gap-2 flex-wrap">
            {activeCompanies.slice(0, 5).map((c) => (
              <span
                key={c.ticker}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono"
              >
                {c.ticker} {c.articleCount}件
              </span>
            ))}
          </div>
        </div>
        <span className="text-slate-500 text-sm shrink-0 ml-2">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-5">
          {/* AIサマリー */}
          <div className="rounded-lg bg-blue-950/30 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-400 font-medium mb-1">
              🤖 本日のAIサマリー
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {snapshot.summary}
            </p>
          </div>

          {/* 注目記事トップ5 */}
          {topArticles.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                注目記事
              </p>
              <div className="space-y-2">
                {topArticles.map((article, i) => (
                  <a
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 group"
                  >
                    <div
                      className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${IMPORTANCE_DOT[article.importance ?? "low"] ?? IMPORTANCE_DOT["low"]}`}
                    />
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {article.category && (
                        <span
                          className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS["その他"]}`}
                        >
                          {article.category}
                        </span>
                      )}
                      <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors line-clamp-1">
                        {article.title}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 企業別状態 */}
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
              企業別状態
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {companies.map((c) => (
                <div
                  key={c.ticker}
                  className="rounded-lg bg-slate-800/50 p-2"
                >
                  <p className="text-[10px] font-mono text-slate-500">
                    {c.ticker}
                  </p>
                  <p className="text-xs text-slate-300 font-medium">
                    {c.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {c.articleCount}件
                    </span>
                    {c.stockClose && (
                      <span
                        className={`text-[10px] font-mono ${(c.stockChange ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        ${c.stockClose.toFixed(0)}
                        {c.stockChange !== null &&
                          ` (${c.stockChange >= 0 ? "+" : ""}${c.stockChange.toFixed(1)}%)`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
