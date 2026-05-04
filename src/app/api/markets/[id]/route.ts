import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";

const CACHE_TTL = 30; // 30 seconds

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cacheKey = `market:${id}`;

  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      bets: { include: { user: { select: { name: true, email: true } } } },
      creator: { select: { name: true, email: true } },
      resolutions: { include: { resolver: { select: { name: true } } } },
    },
  });

  if (!market) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await cacheSet(cacheKey, market, CACHE_TTL);
  return NextResponse.json(market);
}
