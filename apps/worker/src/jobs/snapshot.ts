import "../lib/load-env.js";
import { prisma } from "@semiconductor/db";
import { openai } from "../lib/openai.js";
import { isAiEnabled } from "../lib/ai-config.js";
import {
  isIndustryRelevant,
  rankArticles,
} from "../lib/rank-articles.js";

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

/** GitHub Actions (UTC) でも「日本時間の今日」で区切る */
function getJstDayBounds(now = new Date()) {
  // 例: SNAPSHOT_DATE=2026-08-16 で過去日を再生成可能
  const override = process.env.SNAPSHOT_DATE?.trim();
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    const start = new Date(`${override}T00:00:00+09:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const dateKey = new Date(`${override}T00:00:00.000Z`);
    return { start, end, dateKey, label: override };
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  const start = new Date(`${y}-${m}-${d}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  // Prisma @db.Date 用: カレンダー日を UTC 午夜で保持
  const dateKey = new Date(`${y}-${m}-${d}T00:00:00.000Z`);
  return { start, end, dateKey, label: `${y}-${m}-${d}` };
}

function toRankable<
  T extends {
    title: string;
    titleJa: string | null;
    publishedAt: Date;
    source: string;
    importance: string | null;
    companies: { company: { ticker: string; name?: string } }[];
  },
>(a: T) {
  return {
    ...a,
    title: a.titleJa ?? a.title,
    companies: a.companies.map((ac) => ({
      ticker: ac.company.ticker,
      name: ac.company.name,
    })),
  };
}

async function generateDailySummary(
  articles: { title: string; summary: string | null; category: string | null }[],
  totalCount: number,
  todayRelevantCount: number
): Promise<string> {
  if (totalCount === 0 && articles.length === 0) {
    return "本日は収集された記事がありませんでした。";
  }

  if (articles.length === 0) {
    return `本日 ${totalCount} 件を収集しましたが、半導体関連として注目すべき記事は見つかりませんでした。`;
  }

  const scopeNote =
    todayRelevantCount > 0
      ? `本日の注目記事 ${todayRelevantCount} 件を中心に`
      : `本日の新規関連は少なく、直近の注目記事を中心に`;

  if (!isAiEnabled()) {
    const titles = articles
      .slice(0, 5)
      .map((a) => `・${a.title}`)
      .join("\n");
    return `本日 ${totalCount} 件収集（${scopeNote}）。\n${titles}`;
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
          "あなたは半導体業界の専門アナリストです。半導体業界ニュースを、200字程度の日本語で簡潔にまとめてください。リストに無いトピックは書かないでください。",
      },
      {
        role: "user",
        content: `${scopeNote}まとめてください。\n\n記事一覧:\n${list}`,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
}

async function main() {
  const { start: todayStart, end: tomorrow, dateKey, label } = getJstDayBounds();

  console.log("📸 日次スナップショット生成開始:", label, "(JST)");
  console.log(`🤖 AI要約: ${isAiEnabled() ? "ON" : "OFF"}`);

  const force = process.env.FORCE_SNAPSHOT === "true";
  const existing = await prisma.dailySnapshot.findUnique({
    where: { date: dateKey },
  });
  if (existing && !force) {
    console.log("⚠️ 本日のスナップショットは既に存在します。スキップします。");
    console.log("   上書きする場合: FORCE_SNAPSHOT=true で再実行");
    await prisma.$disconnect();
    return;
  }

  // 本日（JST）収集分
  const todayArticles = await prisma.article.findMany({
    where: {
      publishedAt: { gte: todayStart, lt: tomorrow },
    },
    include: {
      companies: {
        include: { company: { select: { ticker: true, name: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  console.log(`📰 本日の記事数: ${todayArticles.length}件`);

  // ダッシュボードと同じ母集団（直近100件）から関連記事を選定
  const recentCandidates = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: {
      companies: {
        include: { company: { select: { ticker: true, name: true } } },
      },
    },
  });

  const todayRelevant = rankArticles(
    todayArticles.map(toRankable).filter(isIndustryRelevant),
    10,
    20
  );

  // 本日の関連が少ない場合は、ダッシュボードと同じ基準で直近から補完
  const feedRanked = rankArticles(
    recentCandidates.map(toRankable).filter(isIndustryRelevant),
    10,
    20
  );

  const rankedForHighlight =
    todayRelevant.length > 0 ? todayRelevant : feedRanked;

  console.log(
    `⭐ 注目候補: 本日関連 ${todayRelevant.length}件 / フィード上位 ${feedRanked.length}件 → 採用 ${Math.min(rankedForHighlight.length, 5)}件`
  );

  const summary = await generateDailySummary(
    rankedForHighlight.map((a) => ({
      title: a.titleJa ?? a.title,
      summary: a.summary,
      category: a.category,
    })),
    todayArticles.length,
    todayRelevant.length
  );

  const companies = await prisma.company.findMany({
    include: {
      articles: {
        where: {
          article: { publishedAt: { gte: todayStart, lt: tomorrow } },
        },
        include: { article: true },
        orderBy: { article: { publishedAt: "desc" } },
      },
      stockData: {
        where: { date: { gte: todayStart, lt: tomorrow } },
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
      title: ac.article.titleJa ?? ac.article.title,
      url: ac.article.url,
      category: ac.article.category,
    })),
  }));

  const topArticles: TopArticle[] = rankedForHighlight.slice(0, 5).map((a) => ({
    title: a.titleJa ?? a.title,
    url: a.url,
    category: a.category,
    importance: a.importance,
    source: a.source,
    companies: a.companies.map((c) => c.ticker),
  }));

  await prisma.dailySnapshot.upsert({
    where: { date: dateKey },
    create: {
      date: dateKey,
      summary,
      companies: companiesSnapshot,
      articleCount: todayArticles.length,
      topArticles,
    },
    update: {
      summary,
      companies: companiesSnapshot,
      articleCount: todayArticles.length,
      topArticles,
    },
  });

  console.log(
    existing
      ? "✅ 日次スナップショットを更新しました"
      : "✅ 日次スナップショット保存完了"
  );
  for (const [i, a] of topArticles.entries()) {
    console.log(`   ${i + 1}. [${a.source}] ${a.title.slice(0, 60)}`);
  }
  console.log(`   サマリー: ${summary.slice(0, 80)}...`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
