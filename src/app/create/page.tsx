"use client";

import { useCreateFlow } from "./hooks/useCreateFlow";
import {
  ResumableJobsBanner,
  ConsentStep,
  PhotosStep,
  QuestionsStep,
  GeneratingStep,
  PreviewStep,
  BookStep,
} from "./components";

export default function CreatePage() {
  const flow = useCreateFlow();

  return (
    <div className="min-h-screen bg-amber-50 px-6 py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-amber-900">Create your book</h1>

        {flow.resumableJobs.length > 0 && flow.step === "consent" && (
          <ResumableJobsBanner
            jobs={flow.resumableJobs}
            onResume={flow.handleResume}
          />
        )}

        {flow.step === "consent" && (
          <ConsentStep
            consent={flow.consent}
            onConsentChange={flow.setConsent}
            onSubmit={flow.handleConsent}
            loading={flow.loading}
            error={flow.error}
          />
        )}

        {flow.step === "photos" && (
          <PhotosStep
            photos={flow.photos}
            photoUrls={flow.photoUrls}
            onUpload={flow.handlePhotoUpload}
            onRemove={flow.removePhoto}
            onBack={() => flow.setStep("consent")}
            onNext={() => flow.setStep("questions")}
            error={flow.error}
          />
        )}

        {flow.step === "questions" && (
          <QuestionsStep
            onSubmit={flow.handleQuestionsSubmit}
            onBack={() => flow.setStep("photos")}
            loading={flow.loading}
            error={flow.error}
          />
        )}

        {(flow.step === "generating-preview" || flow.step === "generating-full") && (
          <GeneratingStep
            step={flow.step}
            previewFailed={flow.previewFailed}
            fullFailed={flow.fullFailed}
            error={flow.error}
            generationProgress={flow.generationProgress}
            onTryDifferentPhotos={flow.handleTryDifferentPhotos}
            onBackToPreview={flow.handleBackToPreview}
          />
        )}

        {flow.step === "preview" && (
          <PreviewStep
            previewImageUrl={flow.previewImageUrl}
            error={flow.error}
            loading={flow.loading}
            onApprove={flow.handleApprove}
            onRegenerate={flow.handleRegenerate}
            onStartOver={flow.handleStartOver}
          />
        )}

        {flow.step === "book" && (
          <BookStep
            beats={flow.bookData?.beats}
            bookId={flow.bookId}
            error={flow.error}
            loading={flow.loading}
            onPay={flow.handlePay}
            onStartOver={flow.handleStartOver}
          />
        )}
      </div>
    </div>
  );
}
