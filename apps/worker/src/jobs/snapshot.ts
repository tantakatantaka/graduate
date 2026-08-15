import "dotenv/config";
import { prisma } from "@semiconductor/db";
import { openai } from "../lib/openai.js";
import { isAiEnabled } from "../lib/ai-config.js";

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

const SOURCE_SCORE: Record<string, number> = {
  DIGITIMES: 14,
  "Semiconductor Digest": 13,
  "EE Times": 12,
  SemiEngineering: 12,
  "PC Watch": 12,
  日経ビジネス: 10,
  "Tom's Hardware": -40,
  "EE Times Japan": -20,
};

function scoreForSnapshot(article: {
  title: string;
  titleJa: string | null;
  source: string;
  importance: string | null;
  companies: { company: { ticker: string } }[];
}): number {
  let score = SOURCE_SCORE[article.source] ?? 4;
  const tickers = article.companies.map((c) => c.company.ticker);
  if (tickers.includes("AMAT")) score += 100;
  score += Math.min(tickers.filter((t) => t !== "AMAT").length * 40, 120);
  const text = `${article.titleJa ?? ""} ${article.title}`;
  if (/(半導体|semiconductor|hbm|euv|foundry|fab|wafer|nand|dram|チップ)/i.test(text))
    score += 16;
  if (/(決算|earnings|量産|提携|買収|工場)/i.test(text)) score += 14;
  if (article.importance === "high") score += 20;
  else if (article.importance === "medium") score += 8;
  return score;
}

async function generateDailySummary(
  articles: { title: string; summary: string | null; category: string | null }[],
  totalCount: number
): Promise<string> {
  if (totalCount === 0) return "本日は収集された記事がありませんでした。";

  // AIなし: 件数と注目タイトルで簡易サマリー
  if (!isAiEnabled()) {
    const titles = articles
      .slice(0, 5)
      .map((a) => `・${a.title}`)
      .join("\n");
    return `本日 ${totalCount} 件の記事を収集しました。\n${titles}`;
  }

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
          "あなたは半導体業界の専門アナリストです。本日の半導体業界ニュースを、200字程度の日本語で簡潔にまとめてください。",
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
  console.log(`🤖 AI要約: ${isAiEnabled() ? "ON" : "OFF"}`);

  const force = process.env.FORCE_SNAPSHOT === "true";
  const existing = await prisma.dailySnapshot.findUnique({
    where: { date: today },
  });
  if (existing && !force) {
    console.log("⚠️ 本日のスナップショットは既に存在します。スキップします。");
    console.log("   上書きする場合: FORCE_SNAPSHOT=true で再実行");
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

  const ranked = [...articles].sort(
    (a, b) => scoreForSnapshot(b) - scoreForSnapshot(a)
  );

  // 日次サマリー生成（注目記事の日本語タイトルを優先）
  const summary = await generateDailySummary(
    ranked.map((a) => ({
      title: a.titleJa ?? a.title,
      summary: a.summary,
      category: a.category,
    })),
    articles.length
  );

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

  // 注目記事トップ5（ランキング優先）
  const topArticles: TopArticle[] = ranked.slice(0, 5).map((a) => ({
    title: a.titleJa ?? a.title,
    url: a.url,
    category: a.category,
    importance: a.importance,
    source: a.source,
    companies: a.companies.map((ac) => ac.company.ticker),
  }));

  await prisma.dailySnapshot.upsert({
    where: { date: today },
    create: {
      date: today,
      summary,
      companies: companiesSnapshot,
      articleCount: articles.length,
      topArticles,
    },
    update: {
      summary,
      companies: companiesSnapshot,
      articleCount: articles.length,
      topArticles,
    },
  });

  console.log(
    existing ? "✅ 日次スナップショットを更新しました" : "✅ 日次スナップショット保存完了"
  );
  console.log(`   サマリー: ${summary.slice(0, 80)}...`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
