"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import {
  Globe,
  Calendar,
  Clock,
  Loader2,
  Trophy,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface FIFAGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
}

interface Prediction {
  id: string;
  title: string;
  event_date: string;
  status: string;
  event_type: string;
  source_id: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function FIFA2026Page() {
  const supabase = createClient();
  const [games, setGames] = useState<FIFAGame[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [error, setError] = useState("");

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fifa2026/schedule?days=${days}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setGames(json.games || []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load schedule";
      setError(message);
    }
    setLoading(false);
  }, [days]);

  const loadPredictions = useCallback(async () => {
    const { data } = await supabase
      .from("predictions")
      .select("id, title, event_date, status, event_type, source_id")
      .eq("event_type", "fifa2026")
      .order("event_date", { ascending: true });
    setPredictions(data || []);
  }, [supabase]);

  useEffect(() => {
    loadGames();
    loadPredictions();
  }, [loadGames, loadPredictions]);

  const hasPrediction = (gameId: string) => {
    return predictions.find((p) => p.source_id === gameId);
  };

  // Group games by date
  const grouped = games.reduce<Record<string, FIFAGame[]>>((acc, game) => {
    const d = new Date(game.date).toISOString().split("T")[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(game);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full mb-4">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-zinc-300">June 11 — July 19, 2026</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" />
          FIFA World Cup 2026
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Follow the tournament schedule. Predictions open for select matches — make your picks on the Dashboard!
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-400">Show next</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDays(Math.max(1, days - 1))}
              className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-white w-8 text-center">
              {days}
            </span>
            <button
              onClick={() => setDays(Math.min(45, days + 1))}
              className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-zinc-400">days</span>
        </div>

        <Link
          href="/predictions"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
        >
          <Trophy className="w-4 h-4" />
          View FIFA 2026 Predictions
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={loadGames}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* No games */}
      {!loading && !error && games.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No FIFA 2026 games found for the selected period.</p>
        </div>
      )}

      {/* Schedule */}
      {!loading && !error && sortedDates.map((date) => (
        <div key={date} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grouped[date].map((game) => {
              const pred = hasPrediction(game.id);
              const isLive = game.status.toLowerCase().includes("in progress") || game.status.toLowerCase().includes("live");
              const isFinished = game.status.toLowerCase().includes("final") || game.winner;

              return (
                <div
                  key={game.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(game.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium animate-pulse">
                          LIVE
                        </span>
                      )}
                      {isFinished && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
                          Final
                        </span>
                      )}
                      {!isLive && !isFinished && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matchup */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-left">
                      <p className="text-lg font-bold text-white">
                        {game.awayTeam}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {game.shortName.split(" @ ")[0]}
                      </p>
                      {game.awayScore !== undefined && (
                        <p className="text-2xl font-bold text-white mt-1">
                          {game.awayScore}
                        </p>
                      )}
                    </div>

                    <div className="px-4 text-center">
                      <span className="text-sm font-mono text-zinc-500">@</span>
                    </div>

                    <div className="flex-1 text-right">
                      <p className="text-lg font-bold text-white">
                        {game.homeTeam}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {game.shortName.split(" @ ")[1]}
                      </p>
                      {game.homeScore !== undefined && (
                        <p className="text-2xl font-bold text-white mt-1">
                          {game.homeScore}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {game.status}
                    </span>
                    {pred ? (
                      <Link
                        href={`/predictions/${pred.id}`}
                        className="text-xs rounded-lg bg-emerald-500/20 text-emerald-400 px-3 py-1.5 hover:bg-emerald-500/30 transition flex items-center gap-1"
                      >
                        <Trophy className="w-3 h-3" />
                        Make a Pick
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-600">
                        Prediction coming soon
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
