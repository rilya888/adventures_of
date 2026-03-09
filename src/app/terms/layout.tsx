import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Adventures Of",
  description: "Terms of service for Adventures Of personalized storybook platform.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
