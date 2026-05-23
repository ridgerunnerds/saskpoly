import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Auth migrated to Supabase. Use /login instead." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ message: "Auth migrated to Supabase. Use /login instead." }, { status: 410 });
}
