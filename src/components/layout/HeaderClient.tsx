"use client";

import { Menu, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { AnnouncementBar } from "./AnnouncementBar";

const NAV = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function HeaderClient({
  announcementText,
  announcementEnabled,
}: {
  announcementText: string;
  announcementEnabled: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar text={announcementText} enabled={announcementEnabled} />
      <div className="border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#A3A3A3] transition-colors hover:text-[#F5F5F5]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="group relative">
              <button
                disabled
                aria-label="Cart (coming soon)"
                className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg text-[#525252]"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>
              <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-lg border border-[#262626] bg-[#1E1E1E] px-2 py-1 text-xs text-[#A3A3A3] opacity-0 transition-opacity group-hover:opacity-100">
                Coming soon
              </span>
            </div>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#A3A3A3] transition-colors hover:text-[#F5F5F5] md:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-[#262626] bg-[#111111] px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm font-medium text-[#A3A3A3] transition-colors hover:text-[#F5F5F5]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
