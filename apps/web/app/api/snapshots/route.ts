import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "30");

  const [snapshots, total] = await Promise.all([
    prisma.dailySnapshot.findMany({
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        date: true,
        summary: true,
        articleCount: true,
        topArticles: true,
        companies: true,
        createdAt: true,
      },
    }),
    prisma.dailySnapshot.count(),
  ]);

  return NextResponse.json({
    snapshots,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
