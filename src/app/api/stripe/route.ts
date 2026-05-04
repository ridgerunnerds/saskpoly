import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ratelimit } from "@/lib/redis";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, currency = "cad", marketId, outcome } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        marketId,
        outcome: String(outcome),
        userId,
      },
    });

    await prisma.stripePayment.create({
      data: {
        paymentIntentId: paymentIntent.id,
        amount,
        status: "pending",
        userId,
        marketId,
        outcome: Boolean(outcome),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
