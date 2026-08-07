import "dotenv/config";
import Parser from "rss-parser";
import { prisma } from "@semiconductor/db";
import { RSS_SOURCES } from "../lib/rss-sources.js";
import { matchCompanies, COMPANIES } from "../lib/companies.js";
import { summarizeArticle } from "../lib/openai.js";

const parser = new Parser();

async function ensureCompaniesExist() {
  for (const company of COMPANIES) {
    await prisma.company.upsert({
      where: { ticker: company.ticker },
      create: {
        name: company.name,
        nameJa: company.nameJa,
        ticker: company.ticker,
        description: company.description,
        keywords: company.keywords as unknown as string[],
      },
      update: {
        keywords: company.keywords as unknown as string[],
      },
    });
  }
  console.log("✅ 企業マスターデータ確認完了");
}

async function collectFromSource(source: (typeof RSS_SOURCES)[number]) {
  console.log(`📡 収集開始: ${source.name}`);
  let feed;
  try {
    feed = await parser.parseURL(source.url);
  } catch (e) {
    console.error(`❌ RSS取得失敗: ${source.name}`, e);
    return;
  }

  let newCount = 0;
  for (const item of feed.items) {
    if (!item.title || !item.link) continue;

    const existingArticle = await prisma.article.findUnique({
      where: { url: item.link },
    });
    if (existingArticle) continue;

    const matchedTickers = matchCompanies(
      `${item.title} ${item.contentSnippet ?? ""}`
    );

    let summary = null;
    let category = "その他";
    let importance = "medium";

    // 企業にマッチした記事のみAI要約を実行
    if (matchedTickers.length > 0) {
      try {
        const result = await summarizeArticle(
          item.title,
          item.contentSnippet ?? ""
        );
        summary = result.summary;
        category = result.category;
        importance = result.importance;
      } catch (e) {
        console.error(`⚠️ AI要約失敗: ${item.title}`, e);
      }
    }

    const companies = await prisma.company.findMany({
      where: { ticker: { in: matchedTickers } },
    });

    await prisma.article.create({
      data: {
        title: item.title,
        url: item.link,
        summary,
        category,
        importance,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: source.name,
        sourceUrl: source.url,
        companies: {
          create: companies.map((c) => ({ companyId: c.id })),
        },
      },
    });

    newCount++;
    console.log(`  ✓ ${item.title.slice(0, 60)}... [${matchedTickers.join(",")}]`);
  }

  console.log(`✅ ${source.name}: ${newCount}件追加`);
}

async function main() {
  console.log("🚀 RSS収集ジョブ開始:", new Date().toLocaleString("ja-JP"));
  await ensureCompaniesExist();

  for (const source of RSS_SOURCES) {
    await collectFromSource(source);
  }

  console.log("🏁 RSS収集ジョブ完了:", new Date().toLocaleString("ja-JP"));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
