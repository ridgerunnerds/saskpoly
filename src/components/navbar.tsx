"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Menu,
  X,
  Shield,
  Trophy,
  MessageSquare,
  LogIn,
  LogOut,
  User,
} from "lucide-react";

export function Navbar() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }: { data: any }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/";
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <>
      <nav className="border-b border-zinc-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">SaskPoly</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/predictions" className="text-sm text-zinc-300 hover:text-white transition">
                Predictions
              </Link>
              <Link href="/jays" className="text-sm text-zinc-300 hover:text-white transition flex items-center gap-1">
                <Trophy className="w-4 h-4 text-blue-400" />
                Jays
              </Link>
              <Link href="/leaderboard" className="text-sm text-zinc-300 hover:text-white transition flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
              {profile?.role === "admin" && (
                <Link href="/admin" className="text-sm text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/profile" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {displayName}
                  </Link>
                  <span className="text-xs text-emerald-400">{profile?.total_points ?? 0} pts</span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-zinc-300 hover:text-white flex items-center gap-1"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Link>
              )}
            </div>

            <button
              className="md:hidden text-zinc-300"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-800 px-4 py-4 space-y-3">
            <Link href="/predictions" className="block text-sm text-zinc-300">Predictions</Link>
            <Link href="/jays" className="block text-sm text-zinc-300">Jays</Link>
            <Link href="/leaderboard" className="block text-sm text-zinc-300">Leaderboard</Link>
            {profile?.role === "admin" && (
              <Link href="/admin" className="block text-sm text-emerald-400">Admin</Link>
            )}
            {user ? (
              <>
                <Link href="/profile" className="block text-sm text-zinc-300">Profile</Link>
                <button onClick={handleSignOut} className="block text-sm text-zinc-300 text-left">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="block text-sm text-zinc-300">Sign in</Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
