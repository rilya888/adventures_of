"use client";

import { useState, useEffect, useCallback } from "react";
import { createPreviewBlueprint } from "@/lib/create-flow/blueprint";
import { JOB_STATUS, FULL_BOOK_PAGE_COUNT } from "@/lib/constants";
import type { CreateStep, ChildData, ResumableJob, GenerationProgress, BookBeat } from "../types";

const POLL_INTERVAL_MS = 5000;

export function useCreateFlow() {
  const [step, setStep] = useState<CreateStep>("consent");
  const [consent, setConsent] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [child, setChild] = useState<ChildData | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [fullJobId, setFullJobId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [bookData, setBookData] = useState<{ beats: BookBeat[] } | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);
  const [resumableJobs, setResumableJobs] = useState<ResumableJob[]>([]);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

  useEffect(() => {
    fetch("/api/jobs?status=active")
      .then((res) => (res.ok ? res.json() : { jobs: [] }))
      .then((data) => setResumableJobs(data.jobs ?? []))
      .catch(() => {});
  }, []);

  const pollForPreview = useCallback(async (jobId: string) => {
    setGenerationProgress({ completed_count: 0, total_count: 1 });
    const poll = async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const job = await res.json();
      if (job.progress?.completed_count != null) {
        setGenerationProgress({
          completed_count: job.progress.completed_count ?? 0,
          total_count: job.progress.total_count ?? 1,
        });
      }
      if (job.status === JOB_STATUS.READY) {
        setPreviewImageUrl(job.progress?.preview_image_url ?? null);
        setStep("preview");
        return;
      }
      if (job.status === JOB_STATUS.FAILED) {
        setError(job.error ?? "Something went wrong.");
        setPreviewFailed(true);
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
  }, []);

  const pollForFull = useCallback(async (jobId: string) => {
    setGenerationProgress({ completed_count: 0, total_count: FULL_BOOK_PAGE_COUNT });
    const poll = async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const job = await res.json();
      if (job.progress?.completed_count != null) {
        setGenerationProgress({
          completed_count: job.progress.completed_count ?? 0,
          total_count: job.progress.total_count ?? FULL_BOOK_PAGE_COUNT,
        });
      }
      if (job.status === JOB_STATUS.READY && job.story_id) {
        const [storyRes, bookRes] = await Promise.all([
          fetch(`/api/stories/${job.story_id}`),
          fetch(`/api/books/by-story/${job.story_id}`),
        ]);
        if (storyRes?.ok) {
          const story = await storyRes.json();
          setBookData({ beats: story.beats ?? [] });
        }
        if (bookRes?.ok) {
          const { id } = await bookRes.json();
          setBookId(id);
        }
        setStep("book");
        return;
      }
      if (job.status === JOB_STATUS.FAILED) {
        setError(job.error ?? "Something went wrong. You can try again or contact support.");
        setFullFailed(true);
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
  }, []);

  const handleResume = useCallback(
    async (jobId: string, jobType: string) => {
      setError(null);
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) return;
      const job = await res.json();
      if (job.type === "preview") {
        setPreviewJobId(jobId);
        if (job.status === JOB_STATUS.READY) {
          setPreviewImageUrl(job.progress?.preview_image_url ?? null);
          setStep("preview");
        } else {
          setStep("generating-preview");
          pollForPreview(jobId);
        }
      } else {
        setFullJobId(jobId);
        if (job.status === JOB_STATUS.READY && job.story_id) {
          const [storyRes, bookRes] = await Promise.all([
            fetch(`/api/stories/${job.story_id}`),
            fetch(`/api/books/by-story/${job.story_id}`),
          ]);
          if (storyRes?.ok) {
            const story = await storyRes.json();
            setBookData({ beats: story.beats ?? [] });
          }
          if (bookRes?.ok) {
            const { id } = await bookRes.json();
            setBookId(id);
          }
          setStep("book");
        } else {
          setStep("generating-full");
          pollForFull(jobId);
        }
      }
      setResumableJobs([]);
    },
    [pollForPreview, pollForFull]
  );

  const handleConsent = useCallback(async () => {
    if (!consent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_type: "generation", text_version: "v1" }),
      });
      setStep("photos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [consent]);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - photos.length);
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/media/photos", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Upload failed");
        }
        const { asset_id, url } = await res.json();
        setPhotos((p) => [...p, asset_id]);
        setPhotoUrls((u) => ({ ...u, [asset_id]: url }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }, [photos.length]);

  const removePhoto = useCallback((idx: number) => {
    const id = photos[idx];
    setPhotos((p) => p.filter((_, i) => i !== idx));
    if (id) setPhotoUrls((u) => { const next = { ...u }; delete next[id]; return next; });
  }, [photos]);

  const startPreviewJob = useCallback(
    async (cid: string, data: ChildData) => {
      const blueprint = createPreviewBlueprint(data);
      const res = await fetch("/api/jobs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: cid,
          photo_asset_ids: photos,
          blueprint_snapshot: blueprint,
          idempotency_key: `preview-${cid}-${[...photos].sort().join(",")}`,
        }),
      });
      const dataRes = await res.json();
      if (!res.ok) {
        throw new Error(
          res.status === 429 ? (dataRes.message ?? "Too many requests") : (dataRes.error ?? "Failed to start generation")
        );
      }
      setPreviewJobId(dataRes.job_id);
      setPreviewFailed(false);
      pollForPreview(dataRes.job_id);
    },
    [photos, pollForPreview]
  );

  const handleQuestionsSubmit = useCallback(
    async (data: ChildData) => {
      setChild(data);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to save");
        const { id } = await res.json();
        setChildId(id);
        await fetch("/api/consents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consent_type: "generation", child_id: id, text_version: "v1" }),
        });
        await startPreviewJob(id, data);
        setStep("generating-preview");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed";
        setError(msg.includes("Too many") ? "Too many preview requests. Please try again in an hour." : msg);
      } finally {
        setLoading(false);
      }
    },
    [startPreviewJob]
  );

  const handleTryDifferentPhotos = useCallback(() => {
    setPhotos([]);
    setPhotoUrls({});
    setChildId(null);
    setChild(null);
    setPreviewJobId(null);
    setPreviewImageUrl(null);
    setError(null);
    setPreviewFailed(false);
    setStep("photos");
  }, []);

  const handleStartOver = useCallback(() => {
    setPhotos([]);
    setPhotoUrls({});
    setGenerationProgress(null);
    setChild(null);
    setChildId(null);
    setPreviewJobId(null);
    setFullJobId(null);
    setPreviewImageUrl(null);
    setBookData(null);
    setBookId(null);
    setError(null);
    setPreviewFailed(false);
    setFullFailed(false);
    setConsent(false);
    setStep("consent");
  }, []);

  const handleApprove = useCallback(async () => {
    if (!previewJobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${previewJobId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed");
      const { job_id } = await res.json();
      setFullJobId(job_id);
      setFullFailed(false);
      setGenerationProgress(null);
      setStep("generating-full");
      pollForFull(job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [previewJobId, pollForFull]);

  const handleRegenerate = useCallback(async () => {
    if (!previewJobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${previewJobId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.status === 429) {
        setError("You've used your free regenerations. Approve this one or start over.");
        return;
      }
      if (!res.ok) throw new Error("Failed to regenerate");
      const { job_id } = await res.json();
      setPreviewJobId(job_id);
      setPreviewImageUrl(null);
      setStep("generating-preview");
      pollForPreview(job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [previewJobId, pollForPreview]);

  const handlePay = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: bookId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  const handleBackToPreview = useCallback(() => {
    setFullFailed(false);
    setError(null);
    setStep("preview");
  }, []);

  return {
    step,
    setStep,
    consent,
    setConsent,
    photos,
    photoUrls,
    child,
    childId,
    previewJobId,
    fullJobId,
    previewImageUrl,
    bookData,
    bookId,
    error,
    loading,
    previewFailed,
    fullFailed,
    resumableJobs,
    generationProgress,
    handleResume,
    handleConsent,
    handlePhotoUpload,
    removePhoto,
    handleQuestionsSubmit,
    handleTryDifferentPhotos,
    handleStartOver,
    handleApprove,
    handleRegenerate,
    handlePay,
    handleBackToPreview,
  };
}
