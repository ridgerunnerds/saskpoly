"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";
import { Wallet, ArrowUpRight, CheckCircle, AlertCircle, Clock, Copy } from "lucide-react";
import Link from "next/link";

const MIN_WITHDRAWAL = 10;

export default function WithdrawPage() {
  const { data: session } = useSession();
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/balance")
        .then((r) => r.json())
        .then((data) => setBalance(data.balance ?? 0))
        .catch(() => {});

      fetch("/api/withdrawals")
        .then((r) => r.json())
        .then((data) => {
          setWithdrawals(Array.isArray(data) ? data : []);
          setHistoryLoading(false);
        })
        .catch(() => setHistoryLoading(false));
    }
  }, [session]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    const val = parseFloat(amount);
    if (!val || val < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAWAL}`);
      setLoading(false);
      return;
    }
    if (val > balance) {
      setError("Amount exceeds your balance");
      setLoading(false);
      return;
    }
    if (!address) {
      setError("Wallet not connected");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: val, toAddress: address }),
    });
    const data = await res.json();

    setLoading(false);
    if (res.ok) {
      setSuccess(data.message);
      setAmount("");
      setBalance((prev) => prev - val);
      setWithdrawals((prev) => [data.withdrawal, ...prev]);
    } else {
      setError(data.error || "Failed to submit withdrawal");
    }
  };

  const statusBadge = (status: string) => {
    if (status === "PENDING") return <span className="inline-flex items-center gap-1 text-xs text-amber-400"><Clock className="w-3 h-3" /> Pending</span>;
    if (status === "PROCESSING") return <span className="inline-flex items-center gap-1 text-xs text-cyan-400"><Clock className="w-3 h-3" /> Processing</span>;
    if (status === "COMPLETED") return <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="w-3 h-3" /> Completed</span>;
    if (status === "FAILED") return <span className="inline-flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" /> Failed</span>;
    return <span className="text-xs text-zinc-500">{status}</span>;
  };

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Wallet className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white">Connect Wallet</h1>
        <p className="mt-2 text-zinc-400">Connect your wallet to withdraw funds.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center mb-8">
        <ArrowUpRight className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
        <p className="mt-1 text-zinc-400 text-sm">
          Balance: <span className="text-emerald-400 font-semibold">${balance.toFixed(2)}</span>
        </p>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 p-6 text-center mb-8">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white">Request Submitted</h2>
          <p className="mt-2 text-zinc-400 text-sm">{success}</p>
          <button onClick={() => setSuccess(null)} className="mt-4 text-sm text-emerald-400 hover:underline">
            Submit another request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 mb-10">
          {/* Destination */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <label className="block text-sm font-medium text-zinc-300 mb-3">Destination Wallet</label>
            {isConnected && address ? (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-zinc-400">Connected</p>
                  <p className="text-white font-mono">{address.slice(0, 10)}...{address.slice(-6)}</p>
                </div>
                <button type="button" onClick={copyAddress} className="p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition">
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                </button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Connect your wallet above.</p>
            )}
            <p className="mt-2 text-xs text-zinc-500">
              Withdrawals are sent in USDC on Polygon. Processing time: 1–24 hours.
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                min={MIN_WITHDRAWAL}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-8 pr-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                placeholder={`Min $${MIN_WITHDRAWAL}`}
                required
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-zinc-500">Min: ${MIN_WITHDRAWAL}</span>
              <button
                type="button"
                onClick={() => setAmount(balance.toFixed(2))}
                className="text-xs text-emerald-400 hover:underline"
              >
                Max: ${balance.toFixed(2)}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isConnected || balance < MIN_WITHDRAWAL}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition"
          >
            {loading ? "Submitting..." : "Request Withdrawal"}
          </button>

          {!isConnected && (
            <p className="text-xs text-zinc-500 text-center">Connect your wallet to request a withdrawal.</p>
          )}
        </form>
      )}

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Withdrawal History</h2>
        {historyLoading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-zinc-500">No withdrawals yet.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">${w.amount.toFixed(2)}</p>
                    <p className="text-xs text-zinc-500 font-mono">{w.toAddress.slice(0, 8)}...{w.toAddress.slice(-6)}</p>
                  </div>
                  {statusBadge(w.status)}
                </div>
                {w.txHash && (
                  <a
                    href={`https://polygonscan.com/tx/${w.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                  >
                    View tx <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                <p className="mt-1 text-xs text-zinc-600">
                  {new Date(w.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
