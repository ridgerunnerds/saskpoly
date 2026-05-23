import { NextRequest, NextResponse } from "next/server";
import { fetchESPNSchedule } from "@/lib/espn";

export async function POST(req: NextRequest) {
  try {
    const { sport, days } = await req.json();
    const games = await fetchESPNSchedule(sport, days || 3);
    return NextResponse.json({ games });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch ESPN data" }, { status: 500 });
  }
}
