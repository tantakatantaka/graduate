import "../lib/load-env.js";
import { prisma } from "@semiconductor/db";
import { looksJapanese, translateToJa } from "../lib/deepl.js";

/**
 * web/lib/rank-articles.ts と揃えたスコア（フィード表示漏れ防止）
 */
const SOURCE_SCORE: Record<string, number> = {
  "EE Times": 12,
  "EE Times Japan": 12,
  SemiEngineering: 12,
  DIGITIMES: 14,
  "Semiconductor Digest": 13,
  TrendForce: 14,
  DRAMeXchange: 15,
  "SEMI News": 13,
  "SEAJ News": 13,
  "PC Watch": 12,
  日経ビジネス: 10,
  "Tom's Hardware": -40,
};

const PRIORITY_KEYWORDS: { pattern: RegExp; score: number }[] = [
  { pattern: /\b(euv|hbm|hbm3|hbm4|2nm|3nm|gaa|cvd|ald|ale)\b/i, score: 20 },
  { pattern: /(決算|earnings|revenue|ガイダンス)/i, score: 18 },
  { pattern: /(工場|fab|foundry|量産|着工|補助金|規制|export\s*control)/i, score: 16 },
  { pattern: /(合併|買収|m&a|出資|提携)/i, score: 14 },
  { pattern: /(半導体|semiconductor|chip|wafer|nand|dram|dxi|hbm)/i, score: 10 },
];

function score(
  title: string,
  tickers: string[],
  source: string,
  publishedAt: Date,
  importance: string | null
) {
  let s = 0;
  if (tickers.includes("AMAT")) s += 100;
  s += Math.min(tickers.filter((t) => t !== "AMAT").length * 40, 120);

  for (const { pattern, score: kw } of PRIORITY_KEYWORDS) {
    if (pattern.test(title)) s += kw;
  }

  const ageDays = (Date.now() - publishedAt.getTime()) / 86400000;
  if (ageDays <= 1) s += 30;
  else if (ageDays <= 3) s += 20;
  else if (ageDays <= 7) s += 10;
  else if (ageDays <= 14) s += 4;

  s += SOURCE_SCORE[source] ?? 4;

  if (importance === "high") s += 20;
  else if (importance === "medium") s += 8;

  return s;
}

async function translateOne(id: string, title: string) {
  if (looksJapanese(title)) {
    await prisma.article.update({
      where: { id },
      data: { titleJa: title },
    });
    console.log(`  ✓ (原文日本語) ${title.slice(0, 40)}`);
    return;
  }

  const [ja] = await translateToJa([title]);
  await prisma.article.update({
    where: { id },
    data: { titleJa: ja },
  });
  console.log(`  ✓ ${title.slice(0, 40)} → ${ja.slice(0, 40)}`);
}

async function main() {
  console.log("🌐 記事の日本語翻訳開始");

  if (!process.env.DEEPL_API_KEY) {
    console.error("❌ DEEPL_API_KEY 未設定");
    process.exit(1);
  }

  // ① フィード用：優先度上位15件（表示10件＋余裕）
  const candidates = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: {
      companies: { include: { company: { select: { ticker: true } } } },
    },
  });

  // 表示は上位10件。AI重要度更新で順位が動くため余裕を持って翻訳する
  const feedTop = candidates
    .map((a) => ({
      article: a,
      score: score(
        a.title,
        a.companies.map((c) => c.company.ticker),
        a.source,
        a.publishedAt,
        a.importance
      ),
    }))
    .filter((x) => x.score >= 20)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.article.publishedAt.getTime() - a.article.publishedAt.getTime();
    })
    .slice(0, 25)
    .map((x) => x.article);

  // ② 企業カード用：各社の最新5件
  const companies = await prisma.company.findMany({
    include: {
      articles: {
        include: { article: true },
        orderBy: { article: { publishedAt: "desc" } },
        take: 5,
      },
    },
  });

  const cardArticles = companies.flatMap((c) =>
    c.articles.map((ac) => ac.article)
  );

  const byId = new Map<
    string,
    { id: string; title: string; titleJa: string | null }
  >();
  for (const a of [...feedTop, ...cardArticles]) {
    byId.set(a.id, a);
  }

  const needTranslate = [...byId.values()].filter((a) => !a.titleJa);
  console.log(
    `対象: フィード上位${feedTop.length} + 企業カード / 未翻訳: ${needTranslate.length}件`
  );

  for (const article of needTranslate) {
    try {
      await translateOne(article.id, article.title);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`  ❌ 翻訳失敗: ${article.title}`, e);
    }
  }

  console.log("🏁 翻訳完了");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
