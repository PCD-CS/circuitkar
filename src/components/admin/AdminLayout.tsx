"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Bell,
  ShoppingCart,
  Settings,
  FileText,
  Receipt,
  LogOut,
  Menu,
  X,
  Cpu,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/interests", label: "Interests", icon: Bell },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#111111] border-r border-[#262626]">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#262626]">
        <div className="w-8 h-8 rounded bg-[#F97316] flex items-center justify-center">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-mono text-sm font-bold text-[#F5F5F5]">CIRCUITKAR</span>
          <p className="text-[10px] text-[#525252]">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-[#F9731615] text-[#F97316] border border-[#F97316]/20"
                  : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#1E1E1E]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#262626]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#1E1E1E] transition-colors mb-1"
        >
          <Package className="w-4 h-4" />
          View Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#A3A3A3] hover:text-[#EF4444] hover:bg-[#EF444415] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 lg:hidden transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-60">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur px-4 lg:px-6">
          <button
            className="lg:hidden text-[#A3A3A3] hover:text-[#F5F5F5]"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <span className="text-xs text-[#525252] font-mono">Admin</span>
        </div>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
