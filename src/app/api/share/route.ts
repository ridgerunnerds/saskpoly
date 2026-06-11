import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId, platform, predictionId } = await req.json();
    if (!userId || !platform) {
      return NextResponse.json({ error: "Missing userId or platform" }, { status: 400 });
    }

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("social_shares")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", platform)
      .gte("shared_at", `${today}T00:00:00Z`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        points: 0,
        message: "Already shared today — come back tomorrow!" 
      });
    }

    await supabase.from("social_shares").insert({
      user_id: userId,
      platform,
      prediction_id: predictionId || null,
      shared_at: new Date().toISOString(),
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", userId)
      .single();

    await supabase
      .from("profiles")
      .update({ total_points: (profile?.total_points || 0) + 25 })
      .eq("id", userId);

    return NextResponse.json({ 
      success: true, 
      points: 25,
      message: `+25 points for sharing on ${platform}!` 
    });
  } catch (e) {
    console.error("Share error:", e);
    return NextResponse.json({ error: "Share failed" }, { status: 500 });
  }
}
