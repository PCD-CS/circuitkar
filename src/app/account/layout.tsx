import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountLayout } from "@/components/account/AccountLayout";

export default async function AccountRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login?returnTo=/account");
  }
  return <AccountLayout>{children}</AccountLayout>;
}
