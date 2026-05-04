import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      fullLegalName: true,
      dateOfBirth: true,
      phone: true,
      addressStreet: true,
      addressCity: true,
      addressProvince: true,
      addressPostalCode: true,
      addressCountry: true,

      termsAccepted: true,
      termsAcceptedAt: true,
      profileComplete: true,
      balance: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
