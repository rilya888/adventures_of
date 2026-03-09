"use client";

import { ComicPageLayout } from "./ComicPageLayout";
import type { BookBeat } from "../types";

type Props = {
  beats: BookBeat[] | undefined;
  bookId: string | null;
  error: string | null;
  loading: boolean;
  onPay: () => void;
  onStartOver: () => void;
};

export function BookStep({ beats, bookId, error, loading, onPay, onStartOver }: Props) {
  return (
    <div className="mt-8 space-y-6">
      <p className="text-amber-800/90">Your book is ready! Preview below.</p>
      {beats?.map((beat, i) => (
        <ComicPageLayout
          key={i}
          imageUrl={beat.generated_image_url ?? ""}
          caption={beat.generated_text}
          captionPosition="bottom"
          alt={`Page ${i + 1}`}
        />
      ))}
      <div className="flex flex-col gap-4">
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={onPay}
            disabled={!bookId || loading}
            className="rounded-full bg-amber-500 px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Redirecting..." : "Pay $15 — Get your book"}
          </button>
          <button
            onClick={onStartOver}
            className="text-sm text-amber-700 hover:underline"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
