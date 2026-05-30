"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function VerifyPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    // Supabase parses the URL hash on the client automatically and persists
    // the session. We just wait for that, then route the user onward.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.replace("/account");
      }
    });

    // Fallback: if a session already exists, move on.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/account");
    });

    const timer = setTimeout(() => router.replace("/auth/login"), 6000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
      <p className="text-sm text-[#A3A3A3]">Verifying your account…</p>
    </div>
  );
}
