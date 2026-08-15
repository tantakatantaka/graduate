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
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-slate-500",
};

const CATEGORY_COLORS: Record<string, string> = {
  決算: "bg-amber-500/15 text-amber-300",
  技術: "bg-sky-500/15 text-sky-300",
  規制: "bg-orange-500/15 text-orange-300",
  "M&A": "bg-teal-500/15 text-teal-300",
  その他: "bg-slate-500/15 text-slate-400",
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
    <div className="rounded-xl border border-dash-border bg-dash-surface/90 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-dash-panel/70 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-white">{date}</p>
            <p className="text-xs text-dash-dim mt-0.5">
              {snapshot.articleCount}件の記事を収集
            </p>
          </div>
          <div className="hidden sm:flex gap-2 flex-wrap">
            {activeCompanies.slice(0, 5).map((c) => (
              <span
                key={c.ticker}
                className="text-[12px] px-2 py-0.5 rounded-full bg-dash-panel text-dash-muted font-mono border border-dash-border"
              >
                {c.ticker} {c.articleCount}件
              </span>
            ))}
          </div>
        </div>
        <span className="text-dash-dim text-sm shrink-0 ml-2">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-dash-border p-4 space-y-5">
          <div className="rounded-lg bg-[rgba(56,189,248,0.06)] border border-dash-info/25 p-3">
            <p className="text-xs text-dash-info font-medium mb-1">
              本日のサマリー
            </p>
            <p className="text-sm text-dash-muted leading-relaxed">
              {snapshot.summary}
            </p>
          </div>

          {topArticles.length > 0 && (
            <div>
              <p className="text-xs text-dash-dim font-medium uppercase tracking-wider mb-2">
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
                          className={`shrink-0 text-[12px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS["その他"]}`}
                        >
                          {article.category}
                        </span>
                      )}
                      <p className="text-sm text-dash-muted group-hover:text-dash-text transition-colors line-clamp-1">
                        {article.title}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-dash-dim font-medium uppercase tracking-wider mb-2">
              企業別状態
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {companies.map((c) => (
                <div
                  key={c.ticker}
                  className="rounded-lg bg-dash-panel/80 border border-dash-border/60 p-2"
                >
                  <p className="text-[12px] font-mono text-dash-dim">
                    {c.ticker}
                  </p>
                  <p className="text-xs text-dash-muted font-medium">{c.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[12px] text-dash-dim">
                      {c.articleCount}件
                    </span>
                    {c.stockClose && (
                      <span
                        className={`text-[12px] font-mono ${(c.stockChange ?? 0) >= 0 ? "text-teal-400" : "text-rose-400"}`}
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
