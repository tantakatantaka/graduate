import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      articles: {
        include: { article: true },
        orderBy: { article: { publishedAt: "desc" } },
        take: 3,
      },
      stockData: {
        orderBy: { date: "desc" },
        take: 2,
      },
    },
  });

  const result = companies.map((company) => ({
    id: company.id,
    name: company.name,
    nameJa: company.nameJa,
    ticker: company.ticker,
    description: company.description,
    newsUrl: company.newsUrl,
    recentArticles: company.articles.map((ac) => ({
      id: ac.article.id,
      title: ac.article.title,
      url: ac.article.url,
      summary: ac.article.summary,
      category: ac.article.category,
      importance: ac.article.importance,
      publishedAt: ac.article.publishedAt,
      source: ac.article.source,
    })),
    latestStock: company.stockData[0] ?? null,
    previousStock: company.stockData[1] ?? null,
  }));

  return NextResponse.json(result);
}
