import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your book — Adventures Of",
  description:
    "Upload photos, answer a few questions, and get a unique AI-generated storybook where your child is the hero.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
