"use client";

import { Share2, Link2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#525252]">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X / Twitter"
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#262626] px-3 text-xs text-[#A3A3A3] transition-colors hover:border-[#F97316] hover:text-[#F97316]"
      >
        <Share2 className="h-3.5 w-3.5" /> X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#262626] px-3 text-xs text-[#A3A3A3] transition-colors hover:border-[#F97316] hover:text-[#F97316]"
      >
        <Share2 className="h-3.5 w-3.5" /> LinkedIn
      </a>
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#262626] text-[#A3A3A3] transition-colors hover:border-[#F97316] hover:text-[#F97316]"
      >
        {copied ? (
          <Check className="h-4 w-4 text-[#22C55E]" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
