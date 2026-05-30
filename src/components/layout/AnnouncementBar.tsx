"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ck_announcement_dismissed";

export function AnnouncementBar({
  text,
  enabled,
}: {
  text: string;
  enabled: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== text) {
      setVisible(true);
    }
  }, [enabled, text]);

  if (!enabled || !visible) return null;

  return (
    <div className="relative bg-[#F97316] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-10 py-2 text-center">
        <p className="text-sm font-medium">{text}</p>
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, text);
            setVisible(false);
          }}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
