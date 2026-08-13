/** Yahoo Finance チャートAPI（無料・キー不要） */

export type DailyBar = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type ChartResponse = {
  chart?: {
    result?: {
      timestamp?: number[];
      indicators?: {
        quote?: {
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }[];
      };
    }[];
    error?: { description?: string } | null;
  };
};

export async function fetchDailyBars(
  symbol: string,
  range = "1mo"
): Promise<DailyBar[]> {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
  );
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", range);

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SemiconductorDashboard/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance ${symbol}: HTTP ${res.status}`);
  }

  const data = (await res.json()) as ChartResponse;
  if (data.chart?.error) {
    throw new Error(
      `Yahoo Finance ${symbol}: ${data.chart.error.description ?? "error"}`
    );
  }

  const result = data.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  if (!timestamps.length || !quote) return [];

  const bars: DailyBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = quote.close?.[i];
    if (close == null) continue;
    const d = new Date(timestamps[i] * 1000);
    d.setUTCHours(0, 0, 0, 0);
    bars.push({
      date: d,
      open: quote.open?.[i] ?? close,
      high: quote.high?.[i] ?? close,
      low: quote.low?.[i] ?? close,
      close,
      volume: quote.volume?.[i] ?? 0,
    });
  }
  return bars;
}
