"use client";

import React from "react";
import Link from "next/link";

interface TagLink {
  tag: string;
  href: string;
}

interface TagFilterProps {
  tagLinks: TagLink[];
  clearHref: string;
  currentTag: string;
}

export default function TagFilter({ tagLinks, clearHref, currentTag }: TagFilterProps) {
  return (
    <div className="relative mb-8">
      {/* Single-row horizontal scroll strip — hides scrollbar cross-browser */}
      <style>{`.tag-strip::-webkit-scrollbar { display: none; }`}</style>
      <div
        className="tag-strip flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >

        <Link
          href={clearHref}
          className={`flex-shrink-0 rounded-lg border px-3 py-1 text-xs transition-colors ${
            !currentTag
              ? "border-[#F97316] bg-[#F9731615] text-[#F97316]"
              : "border-[#262626] text-[#A3A3A3] hover:border-[#404040] hover:text-[#F5F5F5]"
          }`}
        >
          All
        </Link>

        {tagLinks.map(({ tag, href }) => (
          <Link
            key={tag}
            href={href}
            className={`flex-shrink-0 rounded-lg border px-3 py-1 text-xs transition-colors ${
              currentTag === tag
                ? "border-[#F97316] bg-[#F9731615] text-[#F97316]"
                : "border-[#262626] text-[#A3A3A3] hover:border-[#404040] hover:text-[#F5F5F5]"
            }`}
          >
            {tag}
          </Link>
        ))}
      </div>

      {/* Right-edge fade — hints there are more tags to scroll to */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16"
        style={{
          background: "linear-gradient(to right, transparent, #0a0a0a)",
        }}
      />
    </div>
  );
}
