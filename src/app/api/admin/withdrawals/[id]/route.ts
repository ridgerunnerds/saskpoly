import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, txHash } = body;

  if (!["PROCESSING", "COMPLETED", "FAILED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
  });

  if (!withdrawal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If marking as FAILED, refund the user's balance
  if (status === "FAILED" && withdrawal.status !== "FAILED") {
    await prisma.$transaction([
      prisma.withdrawal.update({
        where: { id },
        data: { status: "FAILED", txHash: txHash || null },
      }),
      prisma.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: withdrawal.amount } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Withdrawal rejected. $${withdrawal.amount.toFixed(2)} refunded to user balance.`,
    });
  }

  const updated = await prisma.withdrawal.update({
    where: { id },
    data: {
      status,
      txHash: txHash || undefined,
    },
  });

  return NextResponse.json({ success: true, withdrawal: updated });
}
