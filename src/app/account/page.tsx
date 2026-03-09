"use client";

import { useState } from "react";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/constants";

export default function AccountPage() {
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/users/export");
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adventures-of-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/users/delete", { method: "POST" });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete account");
      }
    } catch {
      alert("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 px-6 py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-amber-900">Account & Privacy</h1>
        <p className="mt-2 text-sm text-amber-700">
          <a href="/orders" className="underline hover:text-amber-900">My Books</a>
          {" · "}
          <a href="/privacy" className="underline hover:text-amber-900">Privacy Policy</a>
          {" · "}
          <a href="/terms" className="underline hover:text-amber-900">Terms of Service</a>
          {" · "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-amber-900">Contact</a>
        </p>
        <p className="mt-2 text-amber-800/90">
          GDPR: export or delete your data.
        </p>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-medium text-amber-900">
              Export your data
            </h2>
            <p className="mt-1 text-sm text-amber-800/90">
              Download a JSON file with your profile, children, consents, jobs,
              and orders.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="mt-3 rounded-full border border-amber-600 px-6 py-2 font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export my data"}
            </button>
          </section>

          <section>
            <h2 className="text-lg font-medium text-amber-900">
              Delete your account
            </h2>
            <p className="mt-1 text-sm text-amber-800/90">
              Permanently delete all your data. This cannot be undone.
            </p>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                placeholder='Type DELETE to confirm'
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-amber-200 px-3 py-2"
              />
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="rounded-full bg-red-600 px-6 py-2 font-medium text-white disabled:opacity-50 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </section>
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
