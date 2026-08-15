"use client";

import { useState } from "react";
import { WeeklySummary } from "@prisma/client";

type DailyInfo = {
  summary: string;
  date: Date;
  articleCount: number;
} | null;

type Props = {
  daily: DailyInfo;
  weekly: WeeklySummary | null;
};

function formatDate(date: Date, opts: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("ja-JP", opts);
}

export default function WeeklySummaryBanner({ daily, weekly }: Props) {
  const [dailyExpanded, setDailyExpanded] = useState(true);
  const [weeklyExpanded, setWeeklyExpanded] = useState(false);

  if (!daily && !weekly) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {daily && (
        <div className="section-panel tone-daily">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="section-panel__bar tone-daily-bar" />
              <span className="tone-daily-title text-sm font-semibold">
                今日のポイント
              </span>
              <span className="text-xs tone-daily-meta">
                {formatDate(daily.date, { month: "long", day: "numeric" })}
                &nbsp;·&nbsp;{daily.articleCount}件収集
              </span>
            </div>
            <button
              onClick={() => setDailyExpanded(!dailyExpanded)}
              className="text-xs tone-daily-btn transition-colors"
            >
              {dailyExpanded ? "閉じる ▲" : "展開 ▼"}
            </button>
          </div>
          <p
            className={`text-sm text-dash-muted leading-relaxed whitespace-pre-line ${
              !dailyExpanded ? "line-clamp-2" : ""
            }`}
          >
            {daily.summary}
          </p>
        </div>
      )}

      {weekly && (
        <div className="section-panel tone-weekly">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="section-panel__bar tone-weekly-bar" />
              <span className="tone-weekly-title text-sm font-semibold">
                先週の動向
              </span>
              <span className="text-xs tone-weekly-meta">
                {formatDate(weekly.weekOf, { month: "long", day: "numeric" })}週
              </span>
            </div>
            <button
              onClick={() => setWeeklyExpanded(!weeklyExpanded)}
              className="text-xs tone-weekly-btn transition-colors"
            >
              {weeklyExpanded ? "閉じる ▲" : "展開 ▼"}
            </button>
          </div>
          <p
            className={`text-sm text-dash-muted leading-relaxed whitespace-pre-line ${
              !weeklyExpanded ? "line-clamp-2" : ""
            }`}
          >
            {weekly.content}
          </p>
        </div>
      )}
    </div>
  );
}
