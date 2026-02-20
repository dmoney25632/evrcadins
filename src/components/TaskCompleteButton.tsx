"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TaskCompleteButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleComplete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to complete task");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button
        onClick={handleComplete}
        disabled={loading}
        className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full hover:bg-green-200 disabled:opacity-50"
      >
        {loading ? "..." : "Complete"}
      </button>
      {error && <span className="ml-1 text-xs text-red-600">{error}</span>}
    </span>
  );
}
