import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Adventures Of",
  description: "How we collect, use, and protect your data. GDPR-compliant privacy policy.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
