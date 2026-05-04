import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || (user.role !== "ADMIN" && user.role !== "AUDIT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { outcome, evidenceUrl } = body;

  const market = await prisma.market.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolution: outcome,
      resolvedAt: new Date(),
    },
  });

  await prisma.resolution.create({
    data: {
      marketId: id,
      resolverId: user.id,
      outcome,
      evidenceUrl,
    },
  });

  // Update bet statuses
  await prisma.bet.updateMany({
    where: { marketId: id, outcome },
    data: { status: "WON" },
  });

  await prisma.bet.updateMany({
    where: { marketId: id, outcome: { not: outcome } },
    data: { status: "LOST" },
  });

  await cacheDel(`market:${id}`);
  await cacheDel("markets:*");

  return NextResponse.json(market);
}
