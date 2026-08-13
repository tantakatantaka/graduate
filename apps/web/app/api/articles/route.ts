import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rankArticles } from "@/lib/rank-articles";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ranked = searchParams.get("ranked") === "1";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? (ranked ? "10" : "20"));
  const category = searchParams.get("category");

  const where = category ? { category } : {};

  if (ranked) {
    const candidates = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: 100,
      include: {
        companies: {
          include: { company: { select: { name: true, ticker: true } } },
        },
      },
    });

    const mapped = candidates.map((a) => ({
      ...a,
      companies: a.companies.map((ac) => ac.company),
    }));

    const articles = rankArticles(mapped, limit);

    return NextResponse.json({
      articles,
      total: articles.length,
      page: 1,
      totalPages: 1,
      ranked: true,
    });
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        companies: {
          include: { company: { select: { name: true, ticker: true } } },
        },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    articles: articles.map((a) => ({
      ...a,
      companies: a.companies.map((ac) => ac.company),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
