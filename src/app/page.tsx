"use client";

import Link from "next/link";
import { Trophy, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Predict. Compete. <span className="text-emerald-400">Win.</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Make predictions on sports and stocks with your friends. 
          Earn points for correct picks and climb the leaderboard.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="/predictions"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            View Predictions
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white hover:border-zinc-500 transition flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Make Picks</h3>
          <p className="text-sm text-zinc-400">
            Predict outcomes on sports games and stock movements. Lock in your pick before the event.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Discuss</h3>
          <p className="text-sm text-zinc-400">
            Comment on predictions, debate with friends, and share your hot takes.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Earn Points</h3>
          <p className="text-sm text-zinc-400">
            Get points for every correct prediction. Track your accuracy and dominate the leaderboard.
          </p>
        </div>
      </div>
    </div>
  );
}
