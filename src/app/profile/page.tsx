"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User, Shield, AlertCircle, Wallet } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Wallet className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white">Connect Wallet</h1>
        <p className="mt-2 text-zinc-400">Connect your wallet to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-zinc-400">Loading profile...</p>
      </div>
    );
  }

  const field = (label: string, value: string | null) => (
    <div className="py-3 border-b border-zinc-800 last:border-0">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white mt-0.5">{value || <span className="text-zinc-600 italic">Not provided</span>}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Your Profile</h1>
          <p className="text-sm text-zinc-400">
            {profile?.walletAddress ? "Wallet account" : "Tax compliance information"}
          </p>
        </div>
      </div>

      {profile?.profileComplete ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400 mb-6">
          <Shield className="w-4 h-4" />
          Profile complete — verified for tax compliance
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-400 mb-6">
          <AlertCircle className="w-4 h-4" />
          Profile incomplete — some features may be restricted
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        {profile?.walletAddress && field("Wallet", profile.walletAddress)}
        {field("Email", profile?.email)}
        {field("Display Name", profile?.name)}
        {field("Balance", profile?.balance !== undefined ? `$${profile.balance.toFixed(2)}` : null)}
      </div>

      <div className="rounded-2xl border border-zinc-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Legal Identity</h2>
        {field("Full Legal Name", profile?.fullLegalName)}
        {field("Date of Birth", profile?.dateOfBirth)}
        {field("Phone", profile?.phone)}
      </div>

      <div className="rounded-2xl border border-zinc-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Address</h2>
        {field("Street", profile?.addressStreet)}
        {field("City", profile?.addressCity)}
        {field("Province", profile?.addressProvince)}
        {field("Postal Code", profile?.addressPostalCode)}
        {field("Country", profile?.addressCountry)}
      </div>

      <div className="rounded-2xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Compliance</h2>
        {field("Terms Accepted", profile?.termsAccepted ? "Yes" : "No")}
        {field("Terms Accepted At", profile?.termsAcceptedAt ? new Date(profile.termsAcceptedAt).toLocaleDateString() : null)}
      </div>
    </div>
  );
}
