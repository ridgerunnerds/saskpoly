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
    const {
      email,
      password,
      name,
      fullLegalName,
      dateOfBirth,
      phone,
      addressStreet,
      addressCity,
      addressProvince,
      addressPostalCode,
      addressCountry,
      termsAccepted,
    } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!fullLegalName || !dateOfBirth || !phone || !addressStreet || !addressCity || !addressProvince || !addressPostalCode) {
      return NextResponse.json(
        { error: "All profile fields are required for tax compliance" },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service and Privacy Policy" },
        { status: 400 }
      );
    }

    // Validate age (18+)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      return NextResponse.json(
        { error: "You must be at least 18 years old" },
        { status: 400 }
      );
    }

    // Validate Canadian phone
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
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
        name: name || fullLegalName,
        password: hashed,
        role: "USER",
        fullLegalName,
        dateOfBirth,
        phone: phoneDigits,
        addressStreet,
        addressCity,
        addressProvince,
        addressPostalCode: addressPostalCode.toUpperCase(),
        addressCountry: addressCountry || "Canada",
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        profileComplete: true,
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
