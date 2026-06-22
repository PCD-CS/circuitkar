"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Listens for Supabase PASSWORD_RECOVERY events (from reset-password email links
// that land on the site root instead of /auth/reset-password) and redirects
// the user to the reset-password form so they can complete the flow.
export function RecoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/reset-password");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
