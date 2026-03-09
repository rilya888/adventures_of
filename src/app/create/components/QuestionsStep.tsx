"use client";

import { useState } from "react";
import type { ChildData } from "../types";

type Props = {
  onSubmit: (data: ChildData) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
};

export function QuestionsStep({ onSubmit, onBack, loading, error }: Props) {
  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState<"4-6" | "7-9">("4-6");
  const [interests, setInterests] = useState("");
  const [favorites, setFavorites] = useState("");
  const [fearsToAvoid, setFearsToAvoid] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSubmit({
      name: trimmedName,
      age_band: ageBand,
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      favorites: favorites.split(",").map((s) => s.trim()).filter(Boolean),
      fears_to_avoid: fearsToAvoid.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="child-name" className="block text-sm font-medium text-amber-800">
          Child&apos;s name
        </label>
        <input
          id="child-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
          placeholder="e.g. Emma"
          className="mt-1 w-full rounded-lg border border-amber-200 px-3 py-2"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-amber-800">Age</label>
        <select
          value={ageBand}
          onChange={(e) => setAgeBand(e.target.value as "4-6" | "7-9")}
          className="mt-1 w-full rounded-lg border border-amber-200 px-3 py-2"
        >
          <option value="4-6">4–6 years</option>
          <option value="7-9">7–9 years</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-amber-800">Interests (comma-separated)</label>
        <input
          type="text"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g. dinosaurs, space, animals"
          className="mt-1 w-full rounded-lg border border-amber-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-amber-800">Favorites</label>
        <input
          type="text"
          value={favorites}
          onChange={(e) => setFavorites(e.target.value)}
          placeholder="e.g. favorite color, animal"
          className="mt-1 w-full rounded-lg border border-amber-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-amber-800">Fears to avoid</label>
        <input
          type="text"
          value={fearsToAvoid}
          onChange={(e) => setFearsToAvoid(e.target.value)}
          placeholder="e.g. darkness, monsters"
          className="mt-1 w-full rounded-lg border border-amber-200 px-3 py-2"
        />
      </div>
      {error && <p className="text-red-600" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-full border border-amber-600 px-6 py-2 font-medium text-amber-800 disabled:opacity-50 hover:bg-amber-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-full bg-amber-500 px-6 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create my book"}
        </button>
      </div>
    </form>
  );
}
