"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-6">
      <h1 className="text-2xl font-bold text-amber-900">Something went wrong</h1>
      <p className="mt-2 text-center text-amber-800/90">
        An unexpected error occurred. You can try again or go back to the home page.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-amber-500 px-6 py-2 font-medium text-white hover:bg-amber-600"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-amber-600 px-6 py-2 font-medium text-amber-800 hover:bg-amber-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
