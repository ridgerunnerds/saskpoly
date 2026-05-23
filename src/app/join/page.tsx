"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, Loader2, CheckCircle, ArrowRight } from "lucide-react";

const supabase = createClient();

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<"code" | "signup">("code");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<any>(null);

  const validateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data } = await supabase
      .from("invites")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    setLoading(false);

    if (!data) {
      setError("Invalid invite code.");
      return;
    }

    if (data.used_by) {
      setError("This invite code has already been used.");
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setError("This invite code has expired.");
      return;
    }

    setInvite(data);
    if (data.email) {
      setEmail(data.email);
    }
    setStep("signup");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: invite.code,
        email,
        password,
        displayName: displayName || email.split("@")[0],
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (json.error) {
      setError(json.error);
      return;
    }

    // Auto-login after signup
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError("Account created! Please log in.");
      router.push("/login");
      return;
    }

    router.push("/predictions");
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        {step === "code" ? (
          <>
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Have an Invite?</h1>
              <p className="text-sm text-zinc-400 mt-1">Enter your invite code to join</p>
            </div>

            <form onSubmit={validateCode} className="space-y-4">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none text-center font-mono text-lg tracking-widest uppercase"
                placeholder="XXXXXXXX"
                maxLength={8}
              />
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length < 4}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-zinc-500">
              Already have an account?{" "}
              <a href="/login" className="text-emerald-400 hover:underline">
                Sign in
              </a>
            </p>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Welcome!</h1>
              <p className="text-sm text-zinc-400 mt-1">Create your account</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!invite?.email}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? "Creating..." : "Join & Start Predicting"}
              </button>
            </form>

            <button
              onClick={() => setStep("code")}
              className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
            >
              Back to invite code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
