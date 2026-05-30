import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-8xl font-mono font-bold text-[#262626] mb-4">404</p>

        <svg
          className="w-16 h-16 mx-auto mb-6 text-[#F97316]"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="28" width="48" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
          <rect x="28" y="8" width="8" height="48" rx="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.3" />
          <circle cx="32" cy="32" r="3" fill="currentColor" />
          <circle cx="12" cy="32" r="3" fill="currentColor" />
          <circle cx="52" cy="32" r="3" fill="currentColor" />
          <circle cx="32" cy="12" r="3" fill="currentColor" />
          <circle cx="32" cy="52" r="3" fill="currentColor" />
        </svg>

        <h1 className="text-2xl font-mono font-bold text-[#F5F5F5] mb-2">
          Signal Lost
        </h1>
        <p className="text-[#A3A3A3] text-sm mb-8">
          Let&apos;s get you back on track. This page doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-11 px-6 text-sm rounded-lg bg-[#F97316] hover:bg-[#EA6C0A] text-white font-medium transition-colors"
          >
            Browse Components
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 text-sm rounded-lg border border-[#262626] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#F97316] transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
