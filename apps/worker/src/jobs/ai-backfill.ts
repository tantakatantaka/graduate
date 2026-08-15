import "dotenv/config";
import { prisma } from "@semiconductor/db";
import { summarizeArticle } from "../lib/openai.js";

/** 既存の企業マッチ記事に AI 要約を一度流し込む（動作確認用） */
async function main() {
  const limit = Number(process.env.AI_BACKFILL_LIMIT ?? "25");
  console.log(`🤖 AI要約バックフィル開始（最大 ${limit} 件）`);

  const articles = await prisma.article.findMany({
    where: { companies: { some: {} } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  if (articles.length === 0) {
    console.log("⚠️ 対象記事なし");
    return;
  }

  let ok = 0;
  let ng = 0;

  for (const article of articles) {
    try {
      const result = await summarizeArticle(
        article.title,
        article.summary ?? article.title
      );
      await prisma.article.update({
        where: { id: article.id },
        data: {
          summary: result.summary,
          category: result.category,
          importance: result.importance,
        },
      });
      ok++;
      console.log(
        `  ✓ [${result.importance}/${result.category}] ${article.title.slice(0, 50)}`
      );
    } catch (e) {
      ng++;
      console.error(`  ✗ ${article.title.slice(0, 50)}`, e);
    }
  }

  console.log(`✅ 完了: 成功 ${ok} / 失敗 ${ng}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
