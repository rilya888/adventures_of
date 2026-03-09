"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<"pending" | "paid" | "error" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setError("Missing order ID");
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setError(data.error ?? "Failed to load order");
          return;
        }
        if (data.status === "paid") {
          setStatus("paid");
          return;
        }
        setStatus("pending");
        setTimeout(poll, 2000);
      } catch (err) {
        setStatus("error");
        setError("Failed to load order");
      }
    };

    poll();
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-amber-50 px-6 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-bold text-amber-900">Checkout</h1>
          <p className="mt-4 text-amber-800">Missing order ID.</p>
          <Link
            href="/create"
            className="mt-6 inline-block rounded-full bg-amber-500 px-6 py-2 font-medium text-white"
          >
            Back to Create
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-amber-50 px-6 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-bold text-amber-900">Checkout</h1>
          <p className="mt-4 text-red-600">{error}</p>
          <Link
            href="/create"
            className="mt-6 inline-block rounded-full bg-amber-500 px-6 py-2 font-medium text-white"
          >
            Back to Create
          </Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen bg-amber-50 px-6 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-bold text-amber-900">Thank you!</h1>
          <p className="mt-4 text-amber-800">
            Processing your payment. This usually takes a few seconds.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="min-h-screen bg-amber-50 px-6 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-bold text-amber-900">Payment complete!</h1>
          <p className="mt-4 text-amber-800">
            Your book is ready. Download it below.
          </p>
          <a
            href={`/api/orders/${orderId}/download`}
            download
            className="mt-6 inline-block rounded-full bg-amber-500 px-6 py-3 font-medium text-white hover:bg-amber-600"
          >
            Download your book
          </a>
          <Link
            href="/orders"
            className="mt-4 block text-amber-700 hover:underline"
          >
            View My Books
          </Link>
          <Link
            href="/create"
            className="mt-2 block text-amber-700 hover:underline"
          >
            Create another book
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 px-6 py-12">
      <div className="mx-auto max-w-xl text-center">
        <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-amber-50 px-6 py-12 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
