"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Gift, Copy, Check, Share2, Users } from "lucide-react";

export default function ReferralPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code, total_points")
      .eq("id", user.id)
      .single();

    if (profile) {
      setReferralCode(profile.referral_code);
    }

    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", user.id);

    setReferrals(count || 0);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`https://saskpoly.xyz/join?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Refer Friends</h1>
        <p className="text-zinc-400">Sign in to get your referral code and earn bonus points.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Gift className="w-8 h-8 text-emerald-400" />
          Invite Friends
        </h1>
        <p className="text-zinc-400">
          Share SaskPoly with friends and earn bonus points for every signup.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-zinc-400">Your referral link</span>
          <span className="text-sm text-emerald-400 font-medium">{referrals} friends joined</span>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white truncate">
            saskpoly.xyz/join?ref={referralCode}
          </div>
          <button
            onClick={copyCode}
            className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="text-2xl font-bold text-emerald-400 mb-1">+100</div>
          <p className="text-sm text-zinc-400">Points per friend who joins</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="text-2xl font-bold text-blue-400 mb-1">+50</div>
          <p className="text-sm text-zinc-400">Bonus points for your friend</p>
        </div>
      </div>
    </div>
  );
}
