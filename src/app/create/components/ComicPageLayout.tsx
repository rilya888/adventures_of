"use client";

type CaptionPosition = "top" | "bottom";

type Props = {
  imageUrl: string;
  caption?: string | null;
  captionPosition?: CaptionPosition;
  alt?: string;
};

/**
 * Comic-style page layout: image with caption overlay (top or bottom).
 * Empty caption is not rendered.
 */
export function ComicPageLayout({
  imageUrl,
  caption,
  captionPosition = "bottom",
  alt = "Page",
}: Props) {
  const hasCaption = caption != null && caption.trim().length > 0;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-amber-200 bg-white">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full rounded-lg object-cover"
        loading="lazy"
      />
      {hasCaption && (
        <div
          className={`absolute left-0 right-0 px-3 py-2 text-sm font-medium text-amber-950
            md:px-4 md:py-3 md:text-base
            ${captionPosition === "top" ? "top-0" : "bottom-0"}
            bg-amber-100/95 backdrop-blur-sm
            border-amber-200
            ${captionPosition === "top" ? "border-b" : "border-t"}
          `}
          style={{ fontFamily: '"Comic Sans MS", "Comic Neue", cursive' }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
