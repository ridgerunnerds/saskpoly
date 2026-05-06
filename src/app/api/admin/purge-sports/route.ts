import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cacheDel } from "@/lib/redis";

export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sportsKeywords = ["sports", "football", "hockey", "darts", "basketball", "baseball", "soccer"];

  const allMarkets = await prisma.market.findMany({
    select: { id: true, title: true, category: true },
  });

  const toDelete = allMarkets.filter((m) => {
    const cat = (m.category || "").toLowerCase();
    const title = (m.title || "").toLowerCase();
    return sportsKeywords.some((k) => cat.includes(k) || title.includes(k));
  });

  let deletedCount = 0;
  for (const market of toDelete) {
    await prisma.market.delete({ where: { id: market.id } });
    await cacheDel(`market:${market.id}`);
    deletedCount++;
  }

  await cacheDel("markets:*");

  return NextResponse.json({
    success: true,
    deleted: deletedCount,
    markets: toDelete.map((m) => ({ id: m.id, title: m.title, category: m.category })),
  });
}
