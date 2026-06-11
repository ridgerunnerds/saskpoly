"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Trophy, Dices, Coins, ArrowUpDown, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  total_points: number;
  display_name?: string;
}

function CoinFlipGame({ user, onPointsChange }: { user: UserProfile; onPointsChange: () => void }) {
  const [bet, setBet] = useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [won, setWon] = useState<boolean | null>(null);

  const flip = async (choice: "heads" | "tails") => {
    if (flipping) return;
    setBet(choice);
    setFlipping(true);
    setResult(null);
    setWon(null);

    await new Promise(r => setTimeout(r, 1500));
    const outcome = Math.random() > 0.5 ? "heads" : "tails";
    setResult(outcome);
    const didWin = outcome === choice;
    setWon(didWin);
    setFlipping(false);

    const supabase = createClient();
    const change = didWin ? 50 : -20;
    const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", user.id).single();
    await supabase.from("profiles").update({ total_points: Math.max(0, (profile?.total_points || 0) + change) }).eq("id", user.id);
    
    alert(didWin ? "🎉 You won 50 points!" : "😢 You lost 20 points!");
    onPointsChange();
  };

  return (
    <div className="text-center space-y-4">
      <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center text-4xl font-bold transition-all ${
        flipping ? "animate-spin border-yellow-400" : 
        result === "heads" ? "bg-yellow-400 border-yellow-500 text-black" :
        result === "tails" ? "bg-zinc-400 border-zinc-500 text-black" :
        "border-zinc-600"
      }`}>
        {flipping ? "?" : result === "heads" ? "H" : result === "tails" ? "T" : "?"}
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => flip("heads")} disabled={flipping} className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-900 border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 transition disabled:opacity-50">
          Heads
        </button>
        <button onClick={() => flip("tails")} disabled={flipping} className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-900 border border-zinc-400 text-zinc-400 hover:bg-zinc-400/10 transition disabled:opacity-50">
          Tails
        </button>
      </div>
      {won !== null && (
        <p className={won ? "text-emerald-400" : "text-red-400"}>
          {won ? "🎉 You won 50 points!" : "😢 You lost 20 points."}
        </p>
      )}
    </div>
  );
}

function HigherLowerGame({ user, onPointsChange }: { user: UserProfile; onPointsChange: () => void }) {
  const [current, setCurrent] = useState(Math.floor(Math.random() * 10) + 1);
  const [next, setNext] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [streak, setStreak] = useState(0);

  const guess = async (higher: boolean) => {
    if (playing) return;
    setPlaying(true);
    const n = Math.floor(Math.random() * 10) + 1;
    setNext(n);
    
    const correct = higher ? n > current : n < current;
    
    await new Promise(r => setTimeout(r, 800));
    
    const supabase = createClient();
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = 10 * newStreak;
      const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", user.id).single();
      await supabase.from("profiles").update({ total_points: (profile?.total_points || 0) + points }).eq("id", user.id);
      alert(`Correct! Streak: ${newStreak} — +${points} points!`);
    } else {
      setStreak(0);
      const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", user.id).single();
      await supabase.from("profiles").update({ total_points: Math.max(0, (profile?.total_points || 0) - 10) }).eq("id", user.id);
      alert("Wrong! Lost 10 points. Streak reset.");
    }
    
    setCurrent(n);
    setPlaying(false);
    onPointsChange();
  };

  return (
    <div className="text-center space-y-4">
      <div className="text-6xl font-bold text-white">{current}</div>
      <p className="text-zinc-400 text-sm">Next number will be...</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => guess(true)} disabled={playing} className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50">
          <ArrowUpDown className="w-4 h-4 inline mr-1" /> Higher
        </button>
        <button onClick={() => guess(false)} disabled={playing} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50">
          <ArrowUpDown className="w-4 h-4 inline mr-1" /> Lower
        </button>
      </div>
      <p className="text-sm text-emerald-400">Streak: {streak} 🔥</p>
      {next !== null && (
        <p className="text-zinc-300">Next was: {next}</p>
      )}
    </div>
  );
}

export default function GamesPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) setUser(profile);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUser(); }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Dices className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-4">Free Games</h1>
        <p className="text-zinc-400 mb-8">Sign in to play mini-games and earn points!</p>
        <a href="/login" className="inline-block px-6 py-3 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition">
          Sign In to Play
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <Dices className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-white mb-2">Free Games</h1>
        <p className="text-zinc-400">Play mini-games to win points — no purchase required!</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-lg">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-medium">{user.total_points} points</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-white text-lg font-semibold mb-4">
            <Coins className="w-5 h-5 text-yellow-400" />
            Coin Flip
          </h2>
          <CoinFlipGame user={user} onPointsChange={fetchUser} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-white text-lg font-semibold mb-4">
            <ArrowUpDown className="w-5 h-5 text-emerald-400" />
            Higher or Lower
          </h2>
          <HigherLowerGame user={user} onPointsChange={fetchUser} />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-zinc-500 text-sm">
          🎮 More games coming soon — Trivia, Number Guess, and more!
        </p>
      </div>
    </div>
  );
}
