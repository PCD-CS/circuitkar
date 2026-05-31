"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F5F5F5] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#A3A3A3]">
            An unexpected error occurred. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-xs text-[#525252] font-mono mt-2">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F97316] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#EA6C0A] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#262626] px-4 py-2.5 text-sm text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#525252] transition-colors"
          >
            <Home className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
