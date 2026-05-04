import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const pi = await stripe.paymentIntents.create({
      amount: 1000,
      currency: "cad",
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ ok: true, piId: pi.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, type: e.type }, { status: 500 });
  }
}
