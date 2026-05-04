"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Users, DollarSign, Activity } from "lucide-react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [markets, setMarkets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    fetch("/api/markets")
      .then((r) => r.json())
      .then((data) => setMarkets(Array.isArray(data) ? data : []));

    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []));
  }, [status, user, router]);

  if (status === "loading") {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-zinc-500">Loading...</div>;
  }

  if (!user || user.role !== "ADMIN") return null;

  const totalVolume = markets.reduce((a, m) => a + m.totalVolume, 0);
  const openMarkets = markets.filter((m) => m.status === "OPEN").length;
  const resolvedMarkets = markets.filter((m) => m.status === "RESOLVED").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <Shield className="w-6 h-6 text-emerald-400" />
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-zinc-400">Total Markets</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{markets.length}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-zinc-400">Total Volume</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">${totalVolume.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-zinc-400">Open</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{openMarkets}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-zinc-400">Users</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{users.length}</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Markets</h2>
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Bets</th>
              <th className="px-4 py-3">Vig</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {markets.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-900/50">
                <td className="px-4 py-3 text-white font-medium">{m.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "OPEN"
                        ? "bg-emerald-950 text-emerald-400"
                        : m.status === "RESOLVED"
                        ? "bg-cyan-950 text-cyan-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-300">${m.totalVolume.toLocaleString()}</td>
                <td className="px-4 py-3 text-zinc-300">{m.bets?.length || 0}</td>
                <td className="px-4 py-3 text-zinc-300">{m.vigPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
