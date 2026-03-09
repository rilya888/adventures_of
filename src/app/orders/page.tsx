"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { REFUND_WINDOW_DAYS, ORDER_STATUS } from "@/lib/constants";

type Order = {
  id: string;
  status: string;
  book_id: string | null;
  amount_cents: number;
  currency: string;
  created_at: string;
  story_title?: string;
  can_refund: boolean;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load orders");
        return res.json();
      })
      .then((data) => setOrders(data.orders ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  const handleRefund = async (orderId: string) => {
    setRefunding(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/refund-request`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refund failed");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: ORDER_STATUS.REFUNDED, can_refund: false } : o
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setRefunding(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 px-6 py-12 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 px-6 py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-amber-900">My Books</h1>
        <p className="mt-2 text-sm text-amber-700">
          Your orders and downloads. Refunds available within {REFUND_WINDOW_DAYS} days of purchase.
        </p>

        {error && (
          <p className="mt-4 text-red-600">{error}</p>
        )}

        {!error && orders.length === 0 && (
          <p className="mt-8 text-amber-800/90">
            No orders yet.{" "}
            <Link href="/create" className="underline hover:text-amber-900">
              Create your first book
            </Link>
          </p>
        )}

        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-amber-200 bg-white p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-amber-900">
                    {order.story_title ?? "Storybook"}
                  </p>
                  <p className="text-sm text-amber-700">
                    {new Date(order.created_at).toLocaleDateString()} · $
                    {(order.amount_cents / 100).toFixed(2)} · {order.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {order.status === ORDER_STATUS.PAID && (
                    <a
                      href={`/api/orders/${order.id}/download`}
                      download
                      className="rounded-full border border-amber-600 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
                    >
                      Download
                    </a>
                  )}
                  {order.can_refund && (
                    <button
                      onClick={() => handleRefund(order.id)}
                      disabled={refunding === order.id}
                      className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {refunding === order.id ? "Processing..." : "Request refund"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-amber-700 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
