import "dotenv/config";
import { prisma } from "@semiconductor/db";
import { looksJapanese, translateToJa } from "../lib/deepl.js";

/**
 * 簡易スコア（webのrank-articlesと同等の要点）
 * 上位10件のうち titleJa 未設定のものを DeepL で翻訳して保存
 */
function score(title: string, tickers: string[], source: string, publishedAt: Date) {
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

async function main() {
  console.log("🌐 上位記事の日本語翻訳開始");

  if (!process.env.DEEPL_API_KEY) {
    console.error("❌ DEEPL_API_KEY 未設定");
    process.exit(1);
  }

  const candidates = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: {
      companies: { include: { company: { select: { ticker: true } } } },
    },
  });

  const ranked = candidates
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

  const needTranslate = ranked.filter((a) => !a.titleJa);
  console.log(`対象: 上位${ranked.length}件 / 未翻訳: ${needTranslate.length}件`);

  for (const article of needTranslate) {
    if (looksJapanese(article.title)) {
      await prisma.article.update({
        where: { id: article.id },
        data: { titleJa: article.title },
      });
      console.log(`  ✓ (原文日本語) ${article.title.slice(0, 40)}`);
      continue;
    }

    try {
      const [ja] = await translateToJa([article.title]);
      await prisma.article.update({
        where: { id: article.id },
        data: { titleJa: ja },
      });
      console.log(`  ✓ ${article.title.slice(0, 40)} → ${ja.slice(0, 40)}`);
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
