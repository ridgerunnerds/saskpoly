import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

const CACHE_KEY = "markets:all";
const CACHE_TTL = 30; // 30 seconds

export async function GET() {
  const cached = await cacheGet<unknown>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  const markets = await prisma.market.findMany({
    include: { bets: true, creator: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  await cacheSet(CACHE_KEY, markets, CACHE_TTL);
  return NextResponse.json(markets);
}

const CREATION_FEE = 20;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Check user balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user || user.balance < CREATION_FEE) {
    return NextResponse.json(
      { error: `Insufficient balance. A $${CREATION_FEE} fee is required to create a market. Please deposit funds.` },
      { status: 402 }
    );
  }

  const body = await req.json();
  const { title, description, category, closesAt, vigPercent } = body;

  // Deduct creation fee and create market in a transaction-like manner
  await prisma.user.update({
    where: { id: userId },
    data: { balance: { decrement: CREATION_FEE } },
  });

  const market = await prisma.market.create({
    data: {
      title,
      description,
      category,
      closesAt: closesAt ? new Date(closesAt) : null,
      vigPercent: vigPercent ?? 2.5,
      creatorId: userId,
    },
  });

  await cacheDel("markets:*");
  return NextResponse.json({ ...market, feeDeducted: CREATION_FEE });
}
