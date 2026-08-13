import "dotenv/config";
import { prisma } from "@semiconductor/db";
import { fetchDailyBars } from "../lib/yahoo-finance.js";

/**
 * 社内ティッカー → Yahoo Finance シンボル
 * 非上場（KIOXIA / RAPIDUS）は対象外
 * ソニーセミコンダクターは親会社 SONY で代替
 */
const STOCK_SYMBOLS: { ticker: string; yahoo: string; label: string }[] = [
  { ticker: "AMAT", yahoo: "AMAT", label: "Applied Materials" },
  { ticker: "TSM", yahoo: "TSM", label: "TSMC" },
  { ticker: "MU", yahoo: "MU", label: "Micron" },
  { ticker: "SONY-SC", yahoo: "SONY", label: "Sony (親会社)" },
];

async function fetchAndSave(ticker: string, yahoo: string, label: string) {
  const company = await prisma.company.findUnique({ where: { ticker } });
  if (!company) {
    console.log(`  ⚠️ ${ticker} がDBにありません（先に collect を実行）`);
    return;
  }

  console.log(`📈 ${label} (${yahoo})`);
  const bars = await fetchDailyBars(yahoo, "1mo");
  if (bars.length === 0) {
    console.log("  ⚠️ データなし");
    return;
  }

  let saved = 0;
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const prev = i > 0 ? bars[i - 1] : null;
    const change =
      prev && prev.close > 0
        ? ((bar.close - prev.close) / prev.close) * 100
        : null;

    await prisma.stockData.upsert({
      where: {
        companyId_date: {
          companyId: company.id,
          date: bar.date,
        },
      },
      create: {
        companyId: company.id,
        date: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: BigInt(Math.round(bar.volume)),
        change,
      },
      update: {
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: BigInt(Math.round(bar.volume)),
        change,
      },
    });
    saved++;
  }

  const latest = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const chg =
    prev && prev.close > 0
      ? ((latest.close - prev.close) / prev.close) * 100
      : null;
  console.log(
    `  ✓ ${saved}日分保存 / 最新 $${latest.close.toFixed(2)}` +
      (chg != null ? ` (${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%)` : "")
  );
}

async function main() {
  console.log("🚀 株価取得開始:", new Date().toLocaleString("ja-JP"));

  for (const { ticker, yahoo, label } of STOCK_SYMBOLS) {
    try {
      await fetchAndSave(ticker, yahoo, label);
      // レート制限回避
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.error(`  ❌ ${label} 取得失敗:`, e);
    }
  }

  console.log("🏁 株価取得完了");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
