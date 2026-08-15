import "dotenv/config";
import { prisma } from "@semiconductor/db";
import { generateWeeklySummary } from "../lib/openai.js";
import { isAiEnabled } from "../lib/ai-config.js";

async function main() {
  console.log("🚀 週次サマリー生成開始");
  console.log(`🤖 AI要約: ${isAiEnabled() ? "ON" : "OFF"}`);

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

  const mapped = articles.map((a) => ({
    title: a.titleJa ?? a.title,
    summary: a.summary ?? "",
    category: a.category ?? "その他",
  }));

  let content: string;
  if (isAiEnabled()) {
    content = await generateWeeklySummary(mapped);
  } else {
    const lines = mapped
      .slice(0, 8)
      .map((a) => `・[${a.category}] ${a.title}`)
      .join("\n");
    content = `先週の注目トピック（AIオフ）:\n${lines}`;
  }

  const weekOf = new Date();
  weekOf.setHours(0, 0, 0, 0);
  weekOf.setDate(weekOf.getDate() - weekOf.getDay());

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
