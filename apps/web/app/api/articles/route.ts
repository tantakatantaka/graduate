import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const category = searchParams.get("category");

  const where = category ? { category } : {};

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
