import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Adventures Of — Personalized Storybooks",
  description:
    "AI-generated storybooks where your child is the hero. Upload photos, answer a few questions, and get a unique digital book.",
  openGraph: {
    title: "Adventures Of — Your Child as the Hero",
    description:
      "AI-generated storybooks where your child is the hero. Upload photos, answer a few questions, and get a unique digital book.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adventures Of — Personalized Storybooks",
    description:
      "AI-generated storybooks where your child is the hero. Upload photos, answer a few questions, and get a unique digital book.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
