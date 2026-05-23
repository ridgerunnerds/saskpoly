"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { User, Trophy, Target, Loader2, Save } from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myPicks, setMyPicks] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof);
      setDisplayName(prof?.display_name || "");

      const { data: picks } = await supabase
        .from("picks")
        .select("*, predictions(title, status, resolved_option)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMyPicks(picks || []);

      setLoading(false);
    };
    init();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
            <User className="w-8 h-8 text-zinc-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile?.display_name || user?.email}</h1>
            <p className="text-sm text-zinc-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-zinc-900 p-4 text-center">
            <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{profile?.total_points || 0}</p>
            <p className="text-xs text-zinc-500">Points</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-4 text-center">
            <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{profile?.correct_picks || 0}/{profile?.total_picks || 0}</p>
            <p className="text-xs text-zinc-500">Correct</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-4 text-center">
            <p className="text-xl font-bold">
              {profile?.total_picks > 0
                ? ((profile.correct_picks / profile.total_picks) * 100).toFixed(0)
                : 0}
              %
            </p>
            <p className="text-xs text-zinc-500">Accuracy</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">My Picks</h2>
      <div className="space-y-3">
        {myPicks.map((pick) => (
          <div
            key={pick.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">{pick.predictions?.title}</p>
              <p className="text-xs text-zinc-500">
                You picked: {pick.selected_option}
              </p>
            </div>
            <div className="text-right">
              {pick.is_correct === null ? (
                <span className="text-xs text-zinc-500">Pending</span>
              ) : pick.is_correct ? (
                <span className="text-xs text-emerald-400 font-medium">+{pick.points_earned} pts</span>
              ) : (
                <span className="text-xs text-red-400">Wrong</span>
              )}
            </div>
          </div>
        ))}
        {myPicks.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-8">No picks yet. Go make some predictions!</p>
        )}
      </div>
    </div>
  );
}
