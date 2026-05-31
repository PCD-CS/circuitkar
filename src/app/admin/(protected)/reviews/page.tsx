"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  created_at: string;
  product: { name: string; slug: string } | null;
  customer: { full_name: string | null } | null;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-sm" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-[#F97316]" : "text-[#404040]"}>
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

type Tab = "pending" | "approved" | "rejected";

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<AdminReview[]>([]);
  const [approved, setApproved] = useState<AdminReview[]>([]);
  const [rejected, setRejected] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch("/api/admin/reviews?tab=pending"),
        fetch("/api/admin/reviews?tab=approved"),
        fetch("/api/admin/reviews?tab=rejected"),
      ]);
      const [pendingData, approvedData, rejectedData] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        rejectedRes.json(),
      ]);
      if (pendingRes.ok) setPending(pendingData.reviews ?? []);
      if (approvedRes.ok) setApproved(approvedData.reviews ?? []);
      if (rejectedRes.ok) setRejected(rejectedData.reviews ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(review: AdminReview, action: "approve" | "reject" | "restore") {
    setActingId(review.id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, action }),
      });
      if (!res.ok) return;

      // Remove from current list and add to destination list
      if (action === "approve") {
        setPending(prev => prev.filter(r => r.id !== review.id));
        setRejected(prev => prev.filter(r => r.id !== review.id));
        setApproved(prev => [{ ...review, is_approved: true, is_rejected: false }, ...prev]);
      } else if (action === "reject") {
        setPending(prev => prev.filter(r => r.id !== review.id));
        setApproved(prev => prev.filter(r => r.id !== review.id));
        setRejected(prev => [{ ...review, is_approved: false, is_rejected: true }, ...prev]);
      } else {
        // restore → move to pending
        setApproved(prev => prev.filter(r => r.id !== review.id));
        setRejected(prev => prev.filter(r => r.id !== review.id));
        setPending(prev => [{ ...review, is_approved: false, is_rejected: false }, ...prev]);
      }
    } finally {
      setActingId(null);
    }
  }

  const reviews = tab === "pending" ? pending : tab === "approved" ? approved : rejected;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: pending.length },
    { key: "approved", label: "Approved", count: approved.length },
    { key: "rejected", label: "Rejected", count: rejected.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold text-[#F5F5F5]">Reviews</h1>
        <p className="mt-1 text-sm text-[#525252]">Moderate customer product reviews.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#262626]">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? "text-[#F97316]" : "text-[#A3A3A3] hover:text-[#F5F5F5]"
            }`}
          >
            {t.label} ({t.count})
            {tab === t.key && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#F97316]" />}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#262626] bg-[#161616]">
        {loading ? (
          <div className="py-24 text-center text-sm text-[#525252]">Loading…</div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1E1E1E]">
              <MessageSquare className="h-8 w-8 text-[#525252]" />
            </div>
            <p className="text-sm text-[#525252]">No {tab} reviews.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-xs uppercase tracking-wider text-[#525252]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {reviews.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-[#1A1A1A]">
                    <td className="max-w-[140px] px-4 py-3">
                      <p className="truncate text-xs font-medium text-[#F5F5F5]">{r.product?.name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[#F5F5F5]">{r.customer?.full_name || "Anonymous"}</p>
                      {r.is_verified && (
                        <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-[#22C55E]">
                          ✓ Verified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StarDisplay rating={r.rating} /></td>
                    <td className="max-w-[220px] px-4 py-3">
                      {r.title && <p className="truncate text-xs font-semibold text-[#F5F5F5]">{r.title}</p>}
                      {r.body && <p className="line-clamp-2 text-xs text-[#A3A3A3]">{r.body}</p>}
                      {!r.title && !r.body && <span className="text-xs text-[#525252]">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#525252]">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {tab === "pending" && (
                          <>
                            <button
                              disabled={actingId === r.id}
                              onClick={() => act(r, "approve")}
                              className="inline-flex items-center gap-1 rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-1.5 text-xs text-[#22C55E] transition-colors hover:bg-[#22C55E]/20 disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              disabled={actingId === r.id}
                              onClick={() => act(r, "reject")}
                              className="inline-flex items-center gap-1 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 px-2.5 py-1.5 text-xs text-[#EF4444] transition-colors hover:bg-[#EF4444]/20 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {tab === "approved" && (
                          <button
                            disabled={actingId === r.id}
                            onClick={() => act(r, "reject")}
                            className="inline-flex items-center gap-1 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 px-2.5 py-1.5 text-xs text-[#EF4444] transition-colors hover:bg-[#EF4444]/20 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        )}
                        {tab === "rejected" && (
                          <>
                            <button
                              disabled={actingId === r.id}
                              onClick={() => act(r, "approve")}
                              className="inline-flex items-center gap-1 rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-1.5 text-xs text-[#22C55E] transition-colors hover:bg-[#22C55E]/20 disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              disabled={actingId === r.id}
                              onClick={() => act(r, "restore")}
                              className="inline-flex items-center gap-1 rounded-md border border-[#525252]/30 bg-[#525252]/10 px-2.5 py-1.5 text-xs text-[#A3A3A3] transition-colors hover:bg-[#525252]/20 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Re-review
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
