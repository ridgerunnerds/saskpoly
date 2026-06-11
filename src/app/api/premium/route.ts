import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, premium_expires_at, total_points")
    .eq("id", userId)
    .single();

  const isPremium = profile?.is_premium && profile?.premium_expires_at && new Date(profile.premium_expires_at) > new Date();

  return NextResponse.json({ 
    isPremium: !!isPremium,
    expiresAt: profile?.premium_expires_at,
    points: profile?.total_points || 0,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points, is_premium")
      .eq("id", userId)
      .single();

    if (!profile || profile.total_points < 1000) {
      return NextResponse.json({ error: "Not enough points (need 1000)" }, { status: 400 });
    }

    if (profile.is_premium) {
      return NextResponse.json({ error: "Already premium" }, { status: 400 });
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabase
      .from("profiles")
      .update({
        total_points: profile.total_points - 1000,
        is_premium: true,
        premium_expires_at: expires.toISOString(),
      })
      .eq("id", userId);

    return NextResponse.json({ 
      success: true, 
      message: "Premium activated for 30 days!",
      expiresAt: expires.toISOString(),
    });
  } catch (e) {
    console.error("Premium error:", e);
    return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
  }
}
