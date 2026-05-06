import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ratelimit } from "@/lib/redis";

const MIN_WITHDRAWAL = 10;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(withdrawals);
}

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
  const { amount, toAddress } = body;

  const withdrawAmount = parseFloat(amount);
  if (!amount || isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL) {
    return NextResponse.json(
      { error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` },
      { status: 400 }
    );
  }

  if (!toAddress || typeof toAddress !== "string" || !toAddress.startsWith("0x")) {
    return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });
  }

  const userId = (session.user as any).id;

  // Verify the withdrawal address matches the user's connected wallet
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true, walletAddress: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (dbUser.balance < withdrawAmount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 403 });
  }

  if (dbUser.walletAddress && dbUser.walletAddress.toLowerCase() !== toAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Withdrawal address must match your connected wallet" },
      { status: 403 }
    );
  }

  // Create withdrawal and deduct balance in a transaction
  const withdrawal = await prisma.$transaction([
    prisma.withdrawal.create({
      data: {
        userId,
        amount: withdrawAmount,
        toAddress: toAddress.toLowerCase(),
        status: "PENDING",
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: withdrawAmount } },
    }),
  ]);

  return NextResponse.json(
    {
      success: true,
      withdrawal: withdrawal[0],
      message: `Withdrawal request for $${withdrawAmount.toFixed(2)} submitted. It will be processed shortly.`,
    },
    { status: 201 }
  );
}
