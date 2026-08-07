import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const summary = await prisma.weeklySummary.findFirst({
    orderBy: { weekOf: "desc" },
  });

  return NextResponse.json(summary ?? { content: null, weekOf: null });
}
