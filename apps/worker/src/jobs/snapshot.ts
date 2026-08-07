import "dotenv/config";
import { prisma } from "@semiconductor/db";
import { openai } from "../lib/openai.js";

type CompanySnapshot = {
  ticker: string;
  name: string;
  nameJa: string | null;
  articleCount: number;
  stockClose: number | null;
  stockChange: number | null;
  topArticles: { title: string; url: string; category: string | null }[];
};

type TopArticle = {
  title: string;
  url: string;
  category: string | null;
  importance: string | null;
  source: string;
  companies: string[];
};

async function generateDailySummary(
  articles: { title: string; summary: string | null; category: string | null }[]
): Promise<string> {
  if (articles.length === 0) return "本日は収集された記事がありませんでした。";

  const list = articles
    .slice(0, 30)
    .map((a, i) => `${i + 1}. [${a.category ?? "その他"}] ${a.title}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "あなたは半導体業界の専門アナリストです。本日の半導体業界ニュースを、200字程度で簡潔にまとめてください。",
      },
      {
        role: "user",
        content: `本日の記事一覧:\n${list}`,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
}

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log(
    "📸 日次スナップショット生成開始:",
    today.toLocaleDateString("ja-JP")
  );

  // 既存のスナップショットがあればスキップ
  const existing = await prisma.dailySnapshot.findUnique({
    where: { date: today },
  });
  if (existing) {
    console.log("⚠️ 本日のスナップショットは既に存在します。スキップします。");
    await prisma.$disconnect();
    return;
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 本日収集された記事を取得
  const articles = await prisma.article.findMany({
    where: {
      publishedAt: { gte: today, lt: tomorrow },
    },
    include: {
      companies: {
        include: { company: { select: { ticker: true, name: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  console.log(`📰 本日の記事数: ${articles.length}件`);

  // AIで日次サマリー生成
  const summary = await generateDailySummary(articles);

  // 企業ごとの状態を集計
  const companies = await prisma.company.findMany({
    include: {
      articles: {
        where: {
          article: { publishedAt: { gte: today, lt: tomorrow } },
        },
        include: { article: true },
        orderBy: { article: { publishedAt: "desc" } },
      },
      stockData: {
        where: { date: { gte: today, lt: tomorrow } },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });

  const companiesSnapshot: CompanySnapshot[] = companies.map((c) => ({
    ticker: c.ticker,
    name: c.name,
    nameJa: c.nameJa,
    articleCount: c.articles.length,
    stockClose: c.stockData[0]?.close ?? null,
    stockChange: c.stockData[0]?.change ?? null,
    topArticles: c.articles.slice(0, 3).map((ac) => ({
      title: ac.article.title,
      url: ac.article.url,
      category: ac.article.category,
    })),
  }));

  // 注目記事トップ5（importance: high 優先）
  const topArticles: TopArticle[] = articles
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (
        (order[a.importance as keyof typeof order] ?? 2) -
        (order[b.importance as keyof typeof order] ?? 2)
      );
    })
    .slice(0, 5)
    .map((a) => ({
      title: a.title,
      url: a.url,
      category: a.category,
      importance: a.importance,
      source: a.source,
      companies: a.companies.map((ac) => ac.company.ticker),
    }));

  await prisma.dailySnapshot.create({
    data: {
      date: today,
      summary,
      companies: companiesSnapshot,
      articleCount: articles.length,
      topArticles,
    },
  });

  console.log("✅ 日次スナップショット保存完了");
  console.log(`   サマリー: ${summary.slice(0, 80)}...`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
