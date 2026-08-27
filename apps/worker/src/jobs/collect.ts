import "../lib/load-env.js";
import Parser from "rss-parser";
import { prisma } from "@semiconductor/db";
import { RSS_SOURCES } from "../lib/rss-sources.js";
import { matchCompanies, COMPANIES } from "../lib/companies.js";
import { summarizeArticle } from "../lib/openai.js";
import { isAiEnabled, isSemiconductorRelevant } from "../lib/ai-config.js";

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; SemiconductorDashboard/1.0; +https://github.com/tantakatantaka/graduate)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 20000,
});

async function fetchFeed(url: string) {
  try {
    return await parser.parseURL(url);
  } catch {
    // DIGITIMES 等は UA / Accept 不足で 406 になることがあるため、fetch 経由で再試行
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SemiconductorDashboard/1.0; +https://github.com/tantakatantaka/graduate)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      throw new Error(`Status code ${res.status}`);
    }
    const xml = await res.text();
    if (!xml.includes("<rss") && !xml.includes("<rdf:RDF") && !xml.includes("<feed")) {
      throw new Error("Response is not RSS/Atom XML");
    }
    return parser.parseString(xml);
  }
}

async function ensureCompaniesExist() {
  for (const company of COMPANIES) {
    await prisma.company.upsert({
      where: { ticker: company.ticker },
      create: {
        name: company.name,
        nameJa: company.nameJa,
        ticker: company.ticker,
        role: company.role,
        description: company.description,
        newsUrl: company.newsUrl,
        keywords: company.keywords as unknown as string[],
      },
      update: {
        role: company.role,
        description: company.description,
        newsUrl: company.newsUrl,
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
    feed = await fetchFeed(source.url);
  } catch (e) {
    console.error(`❌ RSS取得失敗: ${source.name}`, e);
    return;
  }

  let newCount = 0;
  const feedBase = feed.link || source.url;

  for (const item of feed.items) {
    if (!item.title || !item.link) continue;

    let url: string;
    try {
      url = new URL(item.link, feedBase).toString();
    } catch {
      continue;
    }

    const existingArticle = await prisma.article.findUnique({
      where: { url },
    });
    if (existingArticle) continue;

    // DRAMeXchange の DXI など、タイトルが記号だけの場合は本文先頭で補完
    let title = item.title.trim();
    const snippet = (item.contentSnippet ?? item.content ?? "").replace(
      /<[^>]+>/g,
      " "
    );
    if (title.length <= 4 && snippet.trim()) {
      title = `${title}: ${snippet.trim().slice(0, 80)}`;
    }

    const matchedTickers = matchCompanies(`${title} ${snippet}`);

    let summary: string | null = snippet.slice(0, 120) || null;
    let category = "その他";
    let importance = matchedTickers.length > 0 ? "medium" : "low";

    const textForAi = `${title} ${snippet}`;
    const shouldAi =
      isAiEnabled() &&
      (matchedTickers.length > 0 || isSemiconductorRelevant(textForAi));

    // ENABLE_AI=true のとき、企業マッチまたは半導体関連記事を要約・分類
    if (shouldAi) {
      try {
        const result = await summarizeArticle(title, snippet);
        summary = result.summary;
        category = result.category;
        importance = result.importance;
      } catch (e) {
        console.error(`⚠️ AI要約失敗: ${title}`, e);
      }
    }

    const companies = await prisma.company.findMany({
      where: { ticker: { in: matchedTickers } },
    });

    await prisma.article.create({
      data: {
        title,
        url,
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
    console.log(`  ✓ ${title.slice(0, 60)}... [${matchedTickers.join(",")}]`);
  }

  console.log(`✅ ${source.name}: ${newCount}件追加`);
}

async function main() {
  console.log("🚀 RSS収集ジョブ開始:", new Date().toLocaleString("ja-JP"));
  console.log(`🤖 AI要約: ${isAiEnabled() ? "ON" : "OFF（RSS本文抜粋のみ）"}`);
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
