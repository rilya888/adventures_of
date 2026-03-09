"use client";

import type { ResumableJob } from "../types";

type Props = {
  jobs: ResumableJob[];
  onResume: (jobId: string, jobType: string) => void;
};

export function ResumableJobsBanner({ jobs, onResume }: Props) {
  if (jobs.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-100/50 p-4">
      <p className="text-sm font-medium text-amber-900">You have a book in progress</p>
      <p className="mt-1 text-sm text-amber-800/90">
        You can close this page and come back later. Click below to resume.
      </p>
      <div className="mt-3 space-y-2">
        {jobs.map((j) => (
          <button
            key={j.id}
            onClick={() => onResume(j.id, j.type)}
            className="block w-full rounded-lg border border-amber-400 bg-white px-4 py-2 text-left text-sm font-medium text-amber-900 hover:bg-amber-50"
          >
            Resume {j.type === "preview" ? "character preview" : "full book"} — {j.status}
          </button>
        ))}
      </div>
    </div>
  );
}
