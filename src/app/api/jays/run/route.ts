import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdminUntyped } from "@/lib/supabase-admin";
import { computeMoneyline } from "@/lib/jays-model";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const report = await computeMoneyline();

    if ((report as any).error) {
      return NextResponse.json({ error: (report as any).error }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const game = (report as any).game;

    const { error: dbError } = await getSupabaseAdminUntyped()
      .from("jays_reports")
      .upsert({
        report_date: today,
        report_type: "moneyline",
        game_date: game?.date,
        opponent: game?.opponent,
        venue: game?.venue,
        focus_prob: report.focus_prob,
        opp_prob: report.opp_prob,
        recommendation: report.recommendation,
        confidence: report.confidence,
        reliability: report.reliability,
        details: report.details,
        weather: report.weather,
        pitchers: report.pitchers,
        bullpens: report.bullpens,
        records: report.records,
        generated_at: new Date().toISOString(),
      }, { onConflict: "report_date,report_type" });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate report" }, { status: 500 });
  }
}
