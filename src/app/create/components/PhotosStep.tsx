"use client";

type Props = {
  photos: string[];
  photoUrls: Record<string, string>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (idx: number) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
};

export function PhotosStep({ photos, photoUrls, onUpload, onRemove, onBack, onNext, error }: Props) {
  return (
    <div className="mt-8 space-y-6">
      <p className="text-amber-800/90">
        Upload 2–3 photos of your child. Good lighting and a visible face work best.
      </p>
      <div className="flex flex-wrap gap-4">
        {photos.map((id, i) => (
          <div key={id} className="relative">
            <div className="h-24 w-24 rounded-lg bg-amber-200 overflow-hidden flex items-center justify-center">
              {photoUrls[id] ? (
                <img src={photoUrls[id]} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-amber-800 text-sm">Photo {i + 1}</span>
              )}
            </div>
            <button
              onClick={() => onRemove(i)}
              className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white w-6 h-6 text-xs"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < 3 && (
          <label className="h-24 w-24 rounded-lg border-2 border-dashed border-amber-400 flex items-center justify-center cursor-pointer hover:bg-amber-100">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={onUpload}
              className="hidden"
            />
            <span className="text-amber-700 text-sm">+ Add</span>
          </label>
        )}
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-amber-600 px-6 py-2 font-medium text-amber-800 hover:bg-amber-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={photos.length < 2}
          className="rounded-full bg-amber-500 px-6 py-2 font-medium text-white disabled:opacity-50"
        >
          Next ({photos.length}/3 photos)
        </button>
      </div>
    </div>
  );
}
