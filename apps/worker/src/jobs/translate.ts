import "dotenv/config";
import { prisma } from "@semiconductor/db";
import { looksJapanese, translateToJa } from "../lib/deepl.js";

/**
 * 簡易スコア（webのrank-articlesと同等の要点）
 */
function score(
  title: string,
  tickers: string[],
  source: string,
  publishedAt: Date
) {
  let s = 0;
  if (tickers.includes("AMAT")) s += 100;
  s += Math.min(tickers.filter((t) => t !== "AMAT").length * 40, 120);
  if (/(euv|hbm|semiconductor|半導体|決算|工場|fab)/i.test(title)) s += 15;
  const ageDays = (Date.now() - publishedAt.getTime()) / 86400000;
  if (ageDays <= 1) s += 30;
  else if (ageDays <= 7) s += 10;
  if (source.includes("EE Times") || source === "SemiEngineering") s += 12;
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

  // ① フィード用：優先度上位10件
  const candidates = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: {
      companies: { include: { company: { select: { ticker: true } } } },
    },
  });

  const feedTop = candidates
    .map((a) => ({
      article: a,
      score: score(
        a.title,
        a.companies.map((c) => c.company.ticker),
        a.source,
        a.publishedAt
      ),
    }))
    .filter((x) => x.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.article);

  // ② 企業カード用：各社の最新5件（未翻訳）
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

  // 重複排除
  const byId = new Map<string, { id: string; title: string; titleJa: string | null }>();
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
