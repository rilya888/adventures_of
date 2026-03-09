import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-16">
        <h1 className="text-center text-4xl font-bold tracking-tight text-amber-900">
          Adventures Of
        </h1>
        <p className="text-center text-lg text-amber-800/90">
          A storybook where your child is the hero. Upload photos, answer a few
          questions, and get a unique digital book.
        </p>
        <Link
          href="/create"
          className="rounded-full bg-amber-500 px-8 py-3 font-medium text-white transition-colors hover:bg-amber-600"
        >
          Create a book
        </Link>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-amber-700">
          <Link href="/orders" className="hover:underline">
            My Books
          </Link>
          <Link href="/account" className="hover:underline">
            Account & Privacy
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">
            Contact
          </a>
        </div>
      </main>
    </div>
  );
}
