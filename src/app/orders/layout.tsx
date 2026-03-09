import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Books — Adventures Of",
  description: "Your orders and downloads. View and download your personalized storybooks.",
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
