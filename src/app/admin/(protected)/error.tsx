"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-[#F5F5F5]">Something went wrong</h2>
        {error.digest && <p className="text-xs text-[#525252] font-mono mt-1">ID: {error.digest}</p>}
      </div>
      <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-[#262626] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#F97316] hover:text-[#F97316] transition-colors">
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  );
}
