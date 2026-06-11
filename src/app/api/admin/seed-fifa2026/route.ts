import { NextRequest, NextResponse } from "next/server";
import { fetchESPNSchedule } from "@/lib/espn";
import { getSupabaseAdminUntyped } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdminUntyped();
    const { days = 45, upsert = false } = await req.json().catch(() => ({}));

    const games = await fetchESPNSchedule("fifa2026", Math.min(Math.max(Number(days) || 45, 1), 60));

    // Fetch existing FIFA 2026 predictions by source_id to avoid duplicates
    const sourceIds = games.map((g) => g.id);
    const { data: existing } = await admin
      .from("predictions")
      .select("source_id")
      .eq("source_api", "espn")
      .eq("event_type", "fifa2026")
      .in("source_id", sourceIds);

    const existingIds = new Set((existing || []).map((e: any) => e.source_id));

    const toInsert = games
      .filter((g) => !existingIds.has(g.id))
      .map((g) => ({
        title: `${g.awayTeam} @ ${g.homeTeam}`,
        description: `${g.name} — ${g.status}`,
        category: "sports",
        event_type: "fifa2026",
        source_api: "espn",
        source_id: g.id,
        event_date: g.date,
        options: [g.awayTeam, g.homeTeam, "Draw"],
        points: 10,
        status: "upcoming",
      }));

    let inserted: any[] = [];
    if (toInsert.length > 0) {
      const { data, error } = await admin.from("predictions").insert(toInsert).select("id, title");
      if (error) throw error;
      inserted = data || [];
    }

    return NextResponse.json({
      ok: true,
      scanned: games.length,
      inserted: inserted.length,
      skipped: existingIds.size,
      games: inserted.map((p) => ({ id: p.id, title: p.title })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to seed FIFA 2026 games" },
      { status: 500 }
    );
  }
}
