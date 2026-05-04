"use client";

import { useState } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function CheckoutForm({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      }
    );

    setLoading(false);

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError("Payment was not completed.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
        <CardElement
          options={{
            style: {
              base: {
                color: "#fff",
                fontSize: "16px",
                "::placeholder": { color: "#71717a" },
              },
              invalid: { color: "#f87171" },
            },
          }}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900 transition"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition"
        >
          {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

export function StripeCheckout({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm
        clientSecret={clientSecret}
        amount={amount}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
