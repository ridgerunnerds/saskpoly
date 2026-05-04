"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlusCircle } from "lucide-react";

export default function CreatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Darts");
  const [closesAt, setClosesAt] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setLoading(true);

    const res = await fetch("/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        closesAt: closesAt ? new Date(closesAt).toISOString() : null,
      }),
    });

    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/markets/${data.id}`);
    }
  };

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-zinc-500">
        Sign in to create events.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <PlusCircle className="w-6 h-6 text-emerald-400" />
        Create Event
      </h1>

      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Will Saskatoon Blades win the championship?"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the event and resolution criteria..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
          >
            <option>Darts</option>
            <option>Hockey</option>
            <option>Football</option>
            <option>Baseball</option>
            <option>Politics</option>
            <option>Weather</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Closes At</label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 transition"
        >
          {loading ? "Creating..." : "Create Market"}
        </button>
      </form>
    </div>
  );
}
