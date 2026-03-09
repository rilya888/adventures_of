"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: "2rem", background: "#fffbeb", color: "#1c1917" }}>
        <div style={{ maxWidth: "32rem", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ marginTop: "0.5rem", color: "#92400e" }}>
            An unexpected error occurred. Please try again.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.5rem",
                background: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "0.5rem 1.5rem",
                border: "1px solid #b45309",
                color: "#92400e",
                borderRadius: "9999px",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
