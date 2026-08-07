import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  const company = await prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      articles: {
        include: { article: true },
        orderBy: { article: { publishedAt: "desc" } },
        take: 20,
      },
      stockData: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...company,
    articles: company.articles.map((ac) => ac.article),
  });
}
