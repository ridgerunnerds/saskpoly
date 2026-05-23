"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Trophy,
  Loader2,
  TrendingUp,
  Wind,
  Thermometer,
  Calendar,
  Target,
  Shield,
  Zap,
  Users,
} from "lucide-react";

export default function JaysPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadReports();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data);
      }
    };
    init();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const res = await fetch("/api/jays/latest");
    const json = await res.json();
    setReports(json.reports || []);
    setLoading(false);
  };

  const generateReport = async () => {
    setLoading(true);
    const res = await fetch("/api/jays/run", { method: "POST" });
    const json = await res.json();
    setLoading(false);
    if (json.error) {
      alert(json.error);
    } else {
      loadReports();
    }
  };

  const latest = reports[0];

  const factorLabel = (key: string) => {
    const labels: Record<string, string> = {
      home_field: "Home Field",
      record: "Season Record",
      pitching: "Starting Pitching",
      bullpen: "Bullpen Quality",
      momentum: "Recent Momentum",
      park: "Park Factor",
      weather: "Weather",
      head_to_head: "Head-to-Head",
    };
    return labels[key] || key;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-blue-400" />
          Blue Jays Smart Bet
        </h1>
        {profile?.role === "admin" && (
          <button
            onClick={generateReport}
            disabled={loading}
            className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-blue-400 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? "Running..." : "Run Model"}
          </button>
        )}
      </div>

      {loading && !latest && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No reports yet.</p>
          {profile?.role === "admin" && <p className="text-sm mt-1">Click "Run Model" to generate the first report.</p>}
        </div>
      )}

      {latest && (
        <>
          {/* Main Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">{latest.report_date}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase">{latest.report_type}</span>
            </div>
            <h2 className="text-xl font-bold mb-1">
              {latest.recommendation}
            </h2>
            <p className="text-zinc-400 text-sm">
              vs {latest.opponent} @ {latest.venue}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="rounded-xl bg-zinc-900 p-4 text-center">
                <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xl font-bold">{(latest.focus_prob * 100).toFixed(1)}%</p>
                <p className="text-xs text-zinc-500">Jays Win Prob</p>
              </div>
              <div className="rounded-xl bg-zinc-900 p-4 text-center">
                <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-bold">{(latest.opp_prob * 100).toFixed(1)}%</p>
                <p className="text-xs text-zinc-500">Opp Win Prob</p>
              </div>
              <div className="rounded-xl bg-zinc-900 p-4 text-center">
                <Shield className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xl font-bold">{(latest.confidence * 100).toFixed(1)}%</p>
                <p className="text-xs text-zinc-500">Confidence</p>
              </div>
              <div className="rounded-xl bg-zinc-900 p-4 text-center">
                <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xl font-bold">{(latest.reliability * 100).toFixed(0)}%</p>
                <p className="text-xs text-zinc-500">Reliability</p>
              </div>
            </div>
          </div>

          {/* Factor Breakdown */}
          {latest.details && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">8-Factor Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(latest.details as Record<string, number>).map(([key, val]) => {
                  const pct = Math.abs(val) * 100;
                  const isPositive = val >= 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-zinc-400 w-32 shrink-0">{factorLabel(key)}</span>
                      <div className="flex-1 h-2 rounded-full bg-zinc-900 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPositive ? "bg-blue-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(pct * 5, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-mono w-16 text-right ${isPositive ? "text-blue-400" : "text-red-400"}`}>
                        {val > 0 ? "+" : ""}{(val * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weather */}
          {latest.weather && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Weather</h3>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-amber-400" />
                  <span className="text-sm">{(latest.weather as any).temp}°F</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">{(latest.weather as any).wind_speed} mph {(latest.weather as any).wind_dir}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pitchers */}
          {latest.pitchers && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Pitching Matchup</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["focus", "opp"].map((side) => {
                  const p = (latest.pitchers as any)?.[side];
                  if (!p) return null;
                  return (
                    <div key={side} className="rounded-xl bg-zinc-900 p-4">
                      <p className="text-xs text-zinc-500 uppercase mb-1">{side === "focus" ? "Jays" : "Opponent"}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>ERA: <span className="text-white">{p.era}</span></div>
                        <div>WHIP: <span className="text-white">{p.whip}</span></div>
                        <div>K/9: <span className="text-white">{p.k9}</span></div>
                        <div>BB/9: <span className="text-white">{p.bb9}</span></div>
                        <div>HR/9: <span className="text-white">{p.hr9}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* History */}
      {reports.length > 1 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="text-lg font-semibold mb-4">Report History</h3>
          <div className="space-y-2">
            {reports.slice(1).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{r.report_date}</p>
                  <p className="text-xs text-zinc-500">{r.recommendation}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{(r.focus_prob * 100).toFixed(1)}%</p>
                  <p className="text-xs text-zinc-500">Jays</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
