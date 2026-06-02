"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface TagLink {
  tag: string;
  href: string;
}

interface TagFilterProps {
  tagLinks: TagLink[];
  clearHref: string;
  currentTag: string;
}

const PREVIEW_COUNT = 12;

export default function TagFilter({ tagLinks, clearHref, currentTag }: TagFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = tagLinks.length > PREVIEW_COUNT;
  const visible = expanded ? tagLinks : tagLinks.slice(0, PREVIEW_COUNT);

  // If a non-visible tag is currently active, ensure it's always shown
  const activeTag = tagLinks.find((t) => t.tag === currentTag);
  const activeIsHidden = !expanded && activeTag && !visible.includes(activeTag);
  const displayTags = activeIsHidden ? [...visible, activeTag] : visible;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        <Link
          href={clearHref}
          className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
            !currentTag
              ? "border-[#F97316] bg-[#F9731615] text-[#F97316]"
              : "border-[#262626] text-[#A3A3A3] hover:border-[#404040] hover:text-[#F5F5F5]"
          }`}
        >
          All
        </Link>

        {displayTags.map(({ tag, href }) => (
          <Link
            key={tag}
            href={href}
            className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
              currentTag === tag
                ? "border-[#F97316] bg-[#F9731615] text-[#F97316]"
                : "border-[#262626] text-[#A3A3A3] hover:border-[#404040] hover:text-[#F5F5F5]"
            }`}
          >
            {tag}
          </Link>
        ))}

        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 rounded-lg border border-[#262626] px-3 py-1 text-xs text-[#525252] transition-colors hover:border-[#404040] hover:text-[#A3A3A3]"
          >
            {expanded ? "Show less" : `+${tagLinks.length - PREVIEW_COUNT} more`}
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
