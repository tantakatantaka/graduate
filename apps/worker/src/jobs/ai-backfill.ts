import "../lib/load-env.js";
import { prisma } from "@semiconductor/db";
import { summarizeArticle } from "../lib/openai.js";
import { isAiEnabled, isSemiconductorRelevant } from "../lib/ai-config.js";

/**
 * 既存記事へ AI 要約を流し込む。
 * 対象: 企業マッチ、または半導体関連キーワード（フィード表示漏れ防止）
 */
async function main() {
  if (!isAiEnabled()) {
    console.error("❌ ENABLE_AI=true が必要です");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY 未設定");
    process.exit(1);
  }

  const limit = Number(process.env.AI_BACKFILL_LIMIT ?? "40");
  console.log(`🤖 AI要約バックフィル開始（最大 ${limit} 件）`);

  const candidates = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 120,
    include: {
      companies: { select: { companyId: true } },
    },
  });

  const targets = candidates
    .filter(
      (a) =>
        a.companies.length > 0 ||
        isSemiconductorRelevant(`${a.title} ${a.summary ?? ""}`)
    )
    .slice(0, limit);

  if (targets.length === 0) {
    console.log("⚠️ 対象記事なし");
    return;
  }

  let ok = 0;
  let ng = 0;

  for (const article of targets) {
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
      await new Promise((r) => setTimeout(r, 150));
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
