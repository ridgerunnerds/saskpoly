"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, CheckCircle, XCircle } from "lucide-react";

export default function AuditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [markets, setMarkets] = useState<any[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!user || (user.role !== "AUDIT" && user.role !== "ADMIN")) {
      router.push("/");
      return;
    }

    fetch("/api/markets")
      .then((r) => r.json())
      .then((data) => setMarkets(Array.isArray(data) ? data : []));
  }, [status, user, router]);

  if (status === "loading") {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-zinc-500">Loading...</div>;
  }

  if (!user || (user.role !== "AUDIT" && user.role !== "ADMIN")) return null;

  const openMarkets = markets.filter((m) => m.status === "OPEN");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <ClipboardCheck className="w-6 h-6 text-amber-400" />
        Audit Dashboard
      </h1>

      <h2 className="text-lg font-semibold text-white mb-4">Markets Awaiting Resolution</h2>
      <div className="space-y-4">
        {openMarkets.length === 0 && (
          <p className="text-zinc-500">No open markets to audit.</p>
        )}
        {openMarkets.map((market) => (
          <div key={market.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{market.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{market.description}</p>
                <div className="mt-2 text-xs text-zinc-500">
                  Volume: ${market.totalVolume.toLocaleString()} | Bets: {market.bets?.length || 0} | Vig: {market.vigPercent}%
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    await fetch(`/api/markets/${market.id}/resolve`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ outcome: true }),
                    });
                    const updated = await fetch("/api/markets").then((r) => r.json());
                    setMarkets(Array.isArray(updated) ? updated : []);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-950 border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-900 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve Yes
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/markets/${market.id}/resolve`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ outcome: false }),
                    });
                    const updated = await fetch("/api/markets").then((r) => r.json());
                    setMarkets(Array.isArray(updated) ? updated : []);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-red-950 border border-red-800 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900 transition"
                >
                  <XCircle className="w-4 h-4" />
                  Resolve No
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-white mt-12 mb-4">Recently Resolved</h2>
      <div className="space-y-4">
        {markets
          .filter((m) => m.status === "RESOLVED")
          .slice(0, 5)
          .map((market) => (
            <div key={market.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 opacity-70">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{market.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Resolved: {market.resolution ? "Yes" : "No"} on{" "}
                    {market.resolvedAt ? new Date(market.resolvedAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    market.resolution
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-red-950 text-red-400"
                  }`}
                >
                  {market.resolution ? "Yes" : "No"}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
