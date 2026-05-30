"use client";

import { Menu, ShoppingCart, X, User, Package, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { AnnouncementBar } from "./AnnouncementBar";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { label: "Products", href: "/products" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function initialsFromName(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function HeaderClient({
  announcementText,
  announcementEnabled,
}: {
  announcementText: string;
  announcementEnabled: boolean;
}) {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string | null; email: string } | null>(
    null,
  );
  const [authReady, setAuthReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name:
            (data.user.user_metadata?.full_name as string | undefined) ?? null,
          email: data.user.email ?? "",
        });
      }
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser({
          name:
            (session.user.user_metadata?.full_name as string | undefined) ??
            null,
          email: session.user.email ?? "",
        });
      } else {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

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
            {/* Cart */}
            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#A3A3A3] transition-colors hover:text-[#F5F5F5]"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F97316] px-1 text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {authReady && user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Account menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F9731615] text-xs font-bold text-[#F97316] transition-colors hover:bg-[#F9731630]"
                >
                  {initialsFromName(user.name, user.email)}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-[#262626] bg-[#161616] py-1 shadow-xl">
                    <div className="border-b border-[#262626] px-3 py-2">
                      <p className="truncate text-sm text-[#F5F5F5]">
                        {user.name || "My Account"}
                      </p>
                      <p className="truncate text-xs text-[#525252]">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[#A3A3A3] hover:bg-[#1E1E1E] hover:text-[#F5F5F5]"
                    >
                      <User className="h-4 w-4" /> My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[#A3A3A3] hover:bg-[#1E1E1E] hover:text-[#F5F5F5]"
                    >
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#A3A3A3] hover:bg-[#EF444415] hover:text-[#EF4444]"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : authReady ? (
              <Link
                href="/auth/login"
                className="hidden rounded-lg border border-[#F97316] px-3 py-1.5 text-sm font-medium text-[#F97316] transition-colors hover:bg-[#F9731615] sm:inline-flex"
              >
                Login
              </Link>
            ) : (
              <div className="h-9 w-9" />
            )}

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
            <div className="mt-2 border-t border-[#262626] pt-2">
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-sm font-medium text-[#A3A3A3] hover:text-[#F5F5F5]"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="block py-2.5 text-sm font-medium text-[#A3A3A3] hover:text-[#EF4444]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-sm font-medium text-[#F97316]"
                >
                  Login / Sign up
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
