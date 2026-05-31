"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Deduplicate: only count once per browser session per post
    const key = `ck_viewed_${slug}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    // Fire after a 2-second delay — user has actually read something, not just bounced
    const timer = setTimeout(() => {
      fetch(`/api/blog/${slug}/view`, { method: "POST" }).catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, [slug]);

  return null;
}
