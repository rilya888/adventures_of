"use client";

type CaptionPosition = "top" | "bottom" | "right" | "left";

type Props = {
  imageUrl: string;
  caption?: string | null;
  captionPosition?: CaptionPosition;
  alt?: string;
};

const COMIC_FONT = { fontFamily: '"Comic Sans MS", "Comic Neue", cursive' };

/**
 * Comic-style page layout: image with caption overlay.
 * Right/left: overlay column on image with dark semi-transparent background.
 * Top/bottom: edge band (full-width strip).
 * Empty caption is not rendered.
 */
export function ComicPageLayout({
  imageUrl,
  caption,
  captionPosition = "bottom",
  alt = "Page",
}: Props) {
  const hasCaption = caption != null && caption.trim().length > 0;
  const isSideOverlay = captionPosition === "right" || captionPosition === "left";

  const renderCaption = () => {
    if (!hasCaption || !caption) return null;

    if (isSideOverlay) {
      const paragraphs = caption.split(/\n\n+/).filter(Boolean);
      return (
        <div
          className={`absolute top-4 bottom-4 flex flex-col justify-center overflow-y-auto
            w-[45%] max-w-[220px] md:w-[40%] md:max-w-[280px]
            px-3 py-2 text-xs md:px-4 md:py-3 md:text-sm
            rounded-lg
            bg-black/30 backdrop-blur-sm text-white
            ${captionPosition === "right" ? "right-4" : "left-4"}
          `}
          style={COMIC_FONT}
        >
          {paragraphs.map((p, i) => (
            <p key={i} className={i > 0 ? "mt-3" : ""} style={{ whiteSpace: "pre-line" }}>
              {p}
            </p>
          ))}
        </div>
      );
    }

    return (
      <div
        className={`absolute left-0 right-0 px-3 py-2 text-sm font-medium text-amber-950
          md:px-4 md:py-3 md:text-base
          ${captionPosition === "top" ? "top-0 border-b" : "bottom-0 border-t"}
          border-amber-200 bg-amber-100/95 backdrop-blur-sm
        `}
        style={COMIC_FONT}
      >
        {caption}
      </div>
    );
  };

  return (
    <figure className="relative w-full overflow-hidden rounded-lg border border-amber-200 bg-white">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full rounded-lg object-cover"
        loading="lazy"
      />
      {hasCaption && <figcaption>{renderCaption()}</figcaption>}
    </figure>
  );
}
