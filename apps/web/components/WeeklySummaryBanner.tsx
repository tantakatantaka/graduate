"use client";

import { useState } from "react";
import { WeeklySummary } from "@prisma/client";

export default function WeeklySummaryBanner({
  summary,
}: {
  summary: WeeklySummary;
}) {
  const [expanded, setExpanded] = useState(false);
  const weekOf = new Date(summary.weekOf).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-sm">🤖</span>
          <h2 className="text-sm font-semibold text-blue-300">
            今週の業界AIサマリー
          </h2>
          <span className="text-xs text-blue-500">{weekOf}週</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded ? "閉じる ▲" : "展開 ▼"}
        </button>
      </div>

      <p
        className={`text-sm text-slate-300 leading-relaxed whitespace-pre-line ${!expanded ? "line-clamp-2" : ""}`}
      >
        {summary.content}
      </p>
    </div>
  );
}
