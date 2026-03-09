"use client";

import { SUPPORT_EMAIL } from "@/lib/constants";
import type { CreateStep, GenerationProgress } from "../types";

type Props = {
  step: CreateStep;
  previewFailed: boolean;
  fullFailed: boolean;
  error: string | null;
  generationProgress: GenerationProgress | null;
  onTryDifferentPhotos: () => void;
  onBackToPreview: () => void;
};

export function GeneratingStep({
  step,
  previewFailed,
  fullFailed,
  error,
  generationProgress,
  onTryDifferentPhotos,
  onBackToPreview,
}: Props) {
  if (previewFailed) {
    return (
      <div className="mt-8 space-y-6">
        <p className="text-red-600">{error ?? "Something went wrong."}</p>
        <p className="text-amber-800/90">Try different photos for better results.</p>
        <button
          onClick={onTryDifferentPhotos}
          className="rounded-full bg-amber-500 px-6 py-2 font-medium text-white"
        >
          Try different photos
        </button>
      </div>
    );
  }

  if (fullFailed) {
    return (
      <div className="mt-8 space-y-6">
        <p className="text-red-600">{error ?? "Something went wrong."}</p>
        <p className="text-amber-800/90">
          You can try again or{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-amber-900">
            contact support
          </a>.
        </p>
        <button
          onClick={onBackToPreview}
          className="rounded-full bg-amber-500 px-6 py-2 font-medium text-white"
        >
          Back to preview
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <p className="text-amber-800/90">
        Your book is being created! This usually takes 5–20 minutes. You can close this
        page and come back later.
      </p>
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
        <p className="text-sm text-amber-700">
          {step === "generating-preview"
            ? "Generating character preview..."
            : generationProgress
              ? `Generating page ${generationProgress.completed_count} of ${generationProgress.total_count}...`
              : "Generating full book..."}
        </p>
      </div>
    </div>
  );
}
