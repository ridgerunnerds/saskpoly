import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";
import { findMarketByIdOrSlug } from "@/lib/market-lookup";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, commentId } = await params;

  await prisma.comment.delete({
    where: { id: commentId },
  });

  const market = await findMarketByIdOrSlug(id);
  await cacheDel(`market:${id}`);
  if (market) await cacheDel(`market:${market.id}`);

  return NextResponse.json({ success: true });
}
