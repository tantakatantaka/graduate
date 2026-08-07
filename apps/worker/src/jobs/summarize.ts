import "dotenv/config";
import { prisma } from "@semiconductor/db";
import { generateWeeklySummary } from "../lib/openai.js";

async function main() {
  console.log("🚀 週次サマリー生成開始");

  // 今週の記事を取得
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const articles = await prisma.article.findMany({
    where: {
      publishedAt: { gte: weekAgo },
      summary: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  if (articles.length === 0) {
    console.log("⚠️ 対象記事なし");
    return;
  }

  const content = await generateWeeklySummary(
    articles.map((a) => ({
      title: a.title,
      summary: a.summary ?? "",
      category: a.category ?? "その他",
    }))
  );

  const weekOf = new Date();
  weekOf.setHours(0, 0, 0, 0);
  weekOf.setDate(weekOf.getDate() - weekOf.getDay()); // 週の月曜日

  await prisma.weeklySummary.upsert({
    where: { weekOf },
    create: { content, weekOf },
    update: { content },
  });

  console.log("✅ 週次サマリー生成完了");
  console.log(content);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
