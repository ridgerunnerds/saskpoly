import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ratelimit } from "@/lib/redis";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashed,
        role: "USER",
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
