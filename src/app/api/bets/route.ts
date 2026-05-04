import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ratelimit, cacheDel } from "@/lib/redis";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { marketId, amount, outcome, paymentIntentId } = body;

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "Payment intent ID required" },
      { status: 400 }
    );
  }

  // Verify payment with Stripe
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid payment intent" },
      { status: 400 }
    );
  }

  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json(
      { error: "Payment not completed" },
      { status: 400 }
    );
  }

  // Verify metadata matches
  const userId = (session.user as any).id;
  if (
    paymentIntent.metadata.marketId !== marketId ||
    paymentIntent.metadata.userId !== userId ||
    paymentIntent.metadata.outcome !== String(outcome)
  ) {
    return NextResponse.json(
      { error: "Payment metadata mismatch" },
      { status: 400 }
    );
  }

  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market || market.status !== "OPEN") {
    return NextResponse.json({ error: "Market not open" }, { status: 400 });
  }

  // Check if this payment intent was already used
  const existingBet = await prisma.bet.findFirst({
    where: { marketId, userId, amount: parseFloat(amount), outcome: Boolean(outcome) },
  });
  // Also check stripe payment record
  const stripePayment = await prisma.stripePayment.findUnique({
    where: { paymentIntentId },
  });
  if (stripePayment && stripePayment.status === "succeeded") {
    return NextResponse.json({ error: "Payment already used" }, { status: 400 });
  }

  // Simple constant product share calculation
  const betAmount = parseFloat(amount);
  const vig = betAmount * (market.vigPercent / 100);
  const netAmount = betAmount - vig;

  let shares: number;
  if (outcome) {
    shares = market.yesPool === 0 ? netAmount : (netAmount * market.noPool) / market.yesPool;
  } else {
    shares = market.noPool === 0 ? netAmount : (netAmount * market.yesPool) / market.noPool;
  }

  const bet = await prisma.bet.create({
    data: {
      userId,
      marketId,
      amount: betAmount,
      outcome: Boolean(outcome),
      shares,
    },
  });

  await prisma.market.update({
    where: { id: marketId },
    data: {
      yesPool: outcome ? market.yesPool + netAmount : market.yesPool,
      noPool: !outcome ? market.noPool + netAmount : market.noPool,
      totalVolume: market.totalVolume + betAmount,
    },
  });

  // Mark stripe payment as succeeded
  if (stripePayment) {
    await prisma.stripePayment.update({
      where: { paymentIntentId },
      data: { status: "succeeded" },
    });
  }

  await cacheDel("markets:*");
  return NextResponse.json(bet);
}
