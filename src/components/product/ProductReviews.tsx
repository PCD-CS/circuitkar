"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  created_at: string;
  customer: { full_name: string | null } | null;
}

interface ReviewsData {
  reviews: Review[];
  total: number;
  average: number;
}

function StarDisplay({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "text-xl" : "text-sm";
  return (
    <span className={cls} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-[#F97316]" : "text-[#404040]"}>
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Select rating">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${
              filled
                ? "text-[#F97316]"
                : "text-[#404040] hover:text-[#F97316]/60"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Write-review form state
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/reviews?productId=${productId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
    fetch("/api/account/profile").then((r) => {
      setIsLoggedIn(r.ok);
    });
  }, [loadReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setFormError("Please select a star rating.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/products/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Failed to submit review.");
      } else {
        setFormSuccess(json.message || "Review submitted!");
        setFormOpen(false);
        setRating(0);
        setTitle("");
        setBody("");
        loadReviews();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-xl font-bold text-[#F5F5F5]">
        Customer Reviews
      </h2>

      {/* Summary */}
      {!loading && data && (
        <div className="mb-8 flex flex-wrap items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold text-[#F5F5F5]">
              {data.total > 0 ? data.average.toFixed(1) : "—"}
            </span>
            {data.total > 0 && (
              <StarDisplay rating={Math.round(data.average)} size="lg" />
            )}
            <span className="text-sm text-[#A3A3A3]">
              {data.total} review{data.total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Submit success banner */}
      {formSuccess && (
        <div className="mb-6 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-sm text-[#22C55E]">
          {formSuccess}
        </div>
      )}

      {/* Write a Review CTA / form */}
      {isLoggedIn ? (
        <div className="mb-8">
          {!formOpen ? (
            <button
              onClick={() => {
                setFormOpen(true);
                setFormSuccess("");
              }}
              className="rounded-lg border border-[#F97316]/40 bg-[#F97316]/10 px-4 py-2 text-sm font-medium text-[#F97316] transition-colors hover:bg-[#F97316]/20"
            >
              Write a Review
            </button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-[#262626] bg-[#161616] p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#F5F5F5]">
                  Write a Review
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    setFormError("");
                  }}
                  className="text-xs text-[#525252] hover:text-[#A3A3A3]"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <p className="text-sm text-[#EF4444]">{formError}</p>
              )}

              <div>
                <label className="mb-2 block text-xs font-mono uppercase tracking-wider text-[#A3A3A3]">
                  Your Rating *
                </label>
                <StarSelector value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-[#A3A3A3]">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="Summarise your experience"
                  className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:border-[#F97316] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-[#A3A3A3]">
                  Review (optional)
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Tell others about your experience with this product…"
                  className="w-full resize-none rounded-lg border border-[#262626] bg-[#111111] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:border-[#F97316] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#EA6C0A] disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <p className="mb-8 text-sm text-[#A3A3A3]">
          <Link
            href="/auth/login"
            className="text-[#F97316] hover:text-[#EA6C0A]"
          >
            Login
          </Link>{" "}
          to write a review.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg border border-[#262626] bg-[#161616]"
            />
          ))}
        </div>
      ) : !data || data.reviews.length === 0 ? (
        <div className="rounded-lg border border-[#262626] bg-[#161616] px-6 py-10 text-center text-sm text-[#A3A3A3]">
          No reviews yet. Be the first to review this product!
        </div>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-[#262626] bg-[#161616] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StarDisplay rating={r.rating} />
                  {r.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[11px] font-medium text-[#22C55E]">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#525252]">
                  {new Date(r.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <p className="mt-1 text-xs text-[#525252]">
                by {r.customer?.full_name || "Anonymous"}
              </p>

              {r.title && (
                <p className="mt-3 text-sm font-semibold text-[#F5F5F5]">
                  {r.title}
                </p>
              )}
              {r.body && (
                <p className="mt-1 text-sm leading-relaxed text-[#A3A3A3]">
                  {r.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
