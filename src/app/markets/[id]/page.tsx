"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { TrendingUp, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StripeCheckout } from "@/components/stripe-checkout";

export default function MarketDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [market, setMarket] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [outcome, setOutcome] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/markets/${id}`)
      .then((r) => r.json())
      .then(setMarket)
      .catch(() => {});
  }, [id]);

  const createPaymentIntent = async () => {
    if (!outcome || !amount || !session?.user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          marketId: id,
          outcome,
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async (piId: string) => {
    if (!outcome || !amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: id,
          amount: parseFloat(amount),
          outcome,
          paymentIntentId: piId,
        }),
      });
      if (res.ok) {
        const updated = await fetch(`/api/markets/${id}`).then((r) => r.json());
        setMarket(updated);
        setAmount("");
        setOutcome(null);
        setClientSecret("");
        setPaymentIntentId("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to place bet");
      }
    } finally {
      setLoading(false);
    }
  };

  const resolveMarket = async (resolution: boolean) => {
    const res = await fetch(`/api/markets/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: resolution }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/markets/${id}`).then((r) => r.json());
      setMarket(updated);
    }
  };

  if (!market) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-zinc-500">
        Loading market...
      </div>
    );
  }

  const yesOdds = market.yesPool + market.noPool > 0 ? (market.yesPool / (market.yesPool + market.noPool)) * 100 : 50;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/markets" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to markets
      </Link>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <div className="flex items-center gap-3 mb-4">
          {market.status === "OPEN" && <Clock className="w-5 h-5 text-emerald-400" />}
          {market.status === "RESOLVED" && <CheckCircle className="w-5 h-5 text-cyan-400" />}
          {market.status === "CANCELLED" && <XCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-medium text-zinc-400 uppercase">{market.status}</span>
          <span className="text-xs text-zinc-600">|</span>
          <span className="text-sm text-zinc-500">{market.category}</span>
        </div>

        <h1 className="text-3xl font-bold text-white">{market.title}</h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">{market.description}</p>

        <div className="mt-8">
          <div className="flex justify-between text-sm text-zinc-300 mb-2">
            <span>Yes {yesOdds.toFixed(1)}% - ${market.yesPool.toLocaleString()}</span>
            <span>No {(100 - yesOdds).toFixed(1)}% - ${market.noPool.toLocaleString()}</span>
          </div>
          <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${yesOdds}%` }} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl border border-zinc-800 p-4">
            <div className="text-lg font-bold text-white">${market.totalVolume.toLocaleString()}</div>
            <div className="text-xs text-zinc-500">Total Volume</div>
          </div>
          <div className="rounded-xl border border-zinc-800 p-4">
            <div className="text-lg font-bold text-white">{market.bets?.length || 0}</div>
            <div className="text-xs text-zinc-500">Bets</div>
          </div>
          <div className="rounded-xl border border-zinc-800 p-4">
            <div className="text-lg font-bold text-white">{market.vigPercent}%</div>
            <div className="text-xs text-zinc-500">Vig</div>
          </div>
        </div>

        {market.status === "OPEN" && (
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Place Bet</h3>
            {!session?.user ? (
              <p className="text-sm text-zinc-500">Sign in to place bets.</p>
            ) : clientSecret ? (
              <StripeCheckout
                clientSecret={clientSecret}
                amount={parseFloat(amount)}
                onSuccess={(piId) => placeBet(piId)}
                onCancel={() => {
                  setClientSecret("");
                  setPaymentIntentId("");
                }}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setOutcome(true)}
                    className={`flex-1 py-3 rounded-xl border font-semibold transition ${
                      outcome === true
                        ? "bg-emerald-500 border-emerald-500 text-black"
                        : "border-zinc-700 text-zinc-300 hover:border-emerald-500"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setOutcome(false)}
                    className={`flex-1 py-3 rounded-xl border font-semibold transition ${
                      outcome === false
                        ? "bg-red-500 border-red-500 text-black"
                        : "border-zinc-700 text-zinc-300 hover:border-red-500"
                    }`}
                  >
                    No
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Amount (USD)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={createPaymentIntent}
                  disabled={loading || outcome === null || !amount || parseFloat(amount) <= 0}
                  className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition"
                >
                  {loading ? "Loading..." : "Continue to Payment"}
                </button>
              </div>
            )}
          </div>
        )}

        {(user?.role === "ADMIN" || user?.role === "AUDIT") && market.status === "OPEN" && (
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Resolve Market</h3>
            <div className="flex gap-3">
              <button
                onClick={() => resolveMarket(true)}
                className="flex-1 py-3 rounded-xl border border-emerald-700 text-emerald-400 hover:bg-emerald-950 transition"
              >
                Resolve Yes
              </button>
              <button
                onClick={() => resolveMarket(false)}
                className="flex-1 py-3 rounded-xl border border-red-700 text-red-400 hover:bg-red-950 transition"
              >
                Resolve No
              </button>
            </div>
          </div>
        )}

        {market.bets?.length > 0 && (
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Bets</h3>
            <div className="space-y-2">
              {market.bets.slice(-10).reverse().map((bet: any) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 text-sm"
                >
                  <span className="text-zinc-400">
                    {bet.user?.name || bet.user?.email || "Anonymous"}
                  </span>
                  <span className={`font-medium ${bet.outcome ? "text-emerald-400" : "text-red-400"}`}>
                    {bet.outcome ? "Yes" : "No"}
                  </span>
                  <span className="text-white">${bet.amount.toLocaleString()}</span>
                  <span className="text-xs text-zinc-500">{bet.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
