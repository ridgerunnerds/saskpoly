import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { clearMarketCache } from "@/lib/market-lookup";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || (user.role !== "ADMIN" && user.role !== "AUDIT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { outcome, evidenceUrl } = body;

  const existing = await prisma.market.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const marketId = existing.id;

  const market = await prisma.market.update({
    where: { id: marketId },
    data: {
      status: "RESOLVED",
      resolution: outcome,
      resolvedAt: new Date(),
    },
  });

  await prisma.resolution.create({
    data: {
      marketId,
      resolverId: user.id,
      outcome,
      evidenceUrl,
    },
  });

  // Calculate payouts using parimutuel formula
  // Winners split the entire pool (yesPool + noPool) proportional to their shares
  const winningBets = await prisma.bet.findMany({
    where: { marketId, outcome },
  });

  const losingBets = await prisma.bet.findMany({
    where: { marketId, outcome: { not: outcome } },
  });

  const totalWinningShares = winningBets.reduce((sum, b) => sum + (b.shares || 0), 0);
  const totalPool = market.yesPool + market.noPool;

  if (totalWinningShares > 0 && totalPool > 0) {
    const payoutPerShare = totalPool / totalWinningShares;

    // Credit each winner's balance
    for (const bet of winningBets) {
      const payout = (bet.shares || 0) * payoutPerShare;
      await prisma.bet.update({
        where: { id: bet.id },
        data: { status: "WON", payout },
      });
      await prisma.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: payout } },
      });
    }
  } else if (winningBets.length > 0) {
    // Edge case: winners exist but no shares or pool — refund their original bets
    for (const bet of winningBets) {
      await prisma.bet.update({
        where: { id: bet.id },
        data: { status: "WON", payout: bet.amount },
      });
      await prisma.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: bet.amount } },
      });
    }
  }

  // Mark losers
  for (const bet of losingBets) {
    await prisma.bet.update({
      where: { id: bet.id },
      data: { status: "LOST", payout: 0 },
    });
  }

  await clearMarketCache(id, marketId);

  return NextResponse.json(market);
}
