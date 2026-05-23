import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseAdminUntyped } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { code, email, password, displayName } = await req.json();

    if (!code || !email || !password) {
      return NextResponse.json({ error: "Code, email, and password required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Validate invite
    const { data: invite, error: inviteError } = await getSupabaseAdminUntyped()
      .from("invites")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    if (invite.used_by) {
      return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite code expired" }, { status: 400 });
    }

    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "This invite is for a different email address" }, { status: 400 });
    }

    // Create user
    const { data: user, error: userError } = await getSupabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || email.split("@")[0],
        role: "user",
      },
    });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    // Mark invite as used
    await getSupabaseAdminUntyped()
      .from("invites")
      .update({
        used_by: user.user.id,
        used_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    return NextResponse.json({ success: true, user: user.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to join" }, { status: 500 });
  }
}
