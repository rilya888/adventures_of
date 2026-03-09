"use client";

type Props = {
  previewImageUrl: string | null;
  error: string | null;
  loading: boolean;
  onApprove: () => void;
  onRegenerate: () => void;
  onStartOver: () => void;
};

export function PreviewStep({
  previewImageUrl,
  error,
  loading,
  onApprove,
  onRegenerate,
  onStartOver,
}: Props) {
  return (
    <div className="mt-8 space-y-6">
      <p className="text-amber-800/90">Does this look like your child?</p>
      {previewImageUrl && (
        <img
          src={previewImageUrl}
          alt="Character preview"
          className="w-full max-w-md rounded-lg border border-amber-200"
          loading="eager"
        />
      )}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-4 items-center">
        <button
          onClick={onApprove}
          disabled={loading}
          className="rounded-full bg-green-600 px-6 py-2 font-medium text-white disabled:opacity-50"
        >
          Looks good!
        </button>
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="rounded-full border border-amber-600 px-6 py-2 font-medium text-amber-800 disabled:opacity-50"
        >
          Doesn&apos;t look right
        </button>
        <button
          onClick={onStartOver}
          className="text-sm text-amber-700 hover:underline"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
