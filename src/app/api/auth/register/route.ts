import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Public registration is disabled. Ask the admin to add you." },
    { status: 403 }
  );
}
