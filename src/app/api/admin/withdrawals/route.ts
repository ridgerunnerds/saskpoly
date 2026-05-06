import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, walletAddress: true } },
    },
  });

  return NextResponse.json(withdrawals);
}
