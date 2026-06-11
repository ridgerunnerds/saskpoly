"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Flame, Trophy, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DailyChallengePage() {
  const supabase = createClient();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    setLoading(true);
    const res = await fetch("/api/challenge");
    const data = await res.json();
    setChallenge(data.challenge);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Flame className="w-8 h-8 text-orange-400" />
          Daily Challenge
        </h1>
        <p className="text-zinc-400">
          Pick correctly and earn bonus points. Build your streak!
        </p>
      </div>

      {challenge?.prediction ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Today'"'"'s Challenge</span>
            <span className="ml-auto px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-medium">
              +{challenge.bonus_points} bonus points
            </span>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            {challenge.prediction.title}
          </h2>
          <p className="text-zinc-400 mb-6">
            {challenge.prediction.description}
          </p>

          <Link
            href={`/predictions/${challenge.prediction.id}`}
            className="block w-full text-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition"
          >
            Make Your Pick
          </Link>
        </div>
      ) : (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No challenge available today. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
