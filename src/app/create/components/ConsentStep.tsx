"use client";

type Props = {
  consent: boolean;
  onConsentChange: (checked: boolean) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
};

export function ConsentStep({ consent, onConsentChange, onSubmit, loading, error }: Props) {
  return (
    <div className="mt-8 space-y-6">
      <p className="text-amber-800/90">
        We use AI to generate personalized storybooks. Your child&apos;s photos and
        answers are used only to create the book. We do not share your data.
      </p>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-1"
          aria-describedby="consent-desc"
        />
        <span id="consent-desc" className="text-amber-800/90">
          I consent to upload my child&apos;s photos and use AI to generate a
          personalized book. I understand the content is AI-generated. I have read the{" "}
          <a href="/privacy" className="underline hover:text-amber-900">Privacy Policy</a>{" "}
          and{" "}
          <a href="/terms" className="underline hover:text-amber-900">Terms of Service</a>.
        </span>
      </label>
      {error && <p className="text-red-600">{error}</p>}
      <button
        onClick={onSubmit}
        disabled={!consent || loading}
        className="rounded-full bg-amber-500 px-6 py-2 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Starting..." : "Continue as guest"}
      </button>
    </div>
  );
}
