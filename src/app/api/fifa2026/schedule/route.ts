import { NextRequest, NextResponse } from "next/server";
import { fetchESPNSchedule } from "@/lib/espn";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") || "7");

    const games = await fetchESPNSchedule("fifa2026", days);
    return NextResponse.json({ games });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch FIFA 2026 schedule" },
      { status: 500 }
    );
  }
}
