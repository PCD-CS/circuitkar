import Link from "next/link";
import { Package, MapPin, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "accent" | "success" | "warning" | "status"> = {
  pending: "warning",
  confirmed: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "status",
};

export default async function AccountDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [{ data: profile }, { data: orders }] = await Promise.all([
    admin.from("customer_profiles").select("full_name").eq("id", user!.id).maybeSingle(),
    admin
      .from("orders")
      .select("*")
      .eq("customer_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const allOrders = (orders ?? []) as Order[];
  const totalOrders = allOrders.length;
  const totalSpent = allOrders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const recent = allOrders.slice(0, 3);
  const name = profile?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#F5F5F5]">Hello, {name}</h2>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          Here&apos;s an overview of your account.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-4">
          <p className="text-xs text-[#525252]">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-[#F5F5F5]">{totalOrders}</p>
        </div>
        <div className="rounded-lg border border-[#262626] bg-[#161616] p-4">
          <p className="text-xs text-[#525252]">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-[#F97316]">
            {formatPrice(totalSpent)}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-[#262626] bg-[#161616] p-4 sm:col-span-1">
          <p className="text-xs text-[#525252]">Account</p>
          <p className="mt-1 truncate text-sm text-[#F5F5F5]">{user?.email}</p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Recent Orders</h3>
          <Link
            href="/account/orders"
            className="text-xs text-[#F97316] hover:text-[#EA6C0A]"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-[#262626] bg-[#161616] p-6 text-center text-sm text-[#A3A3A3]">
            No orders yet.{" "}
            <Link href="/products" className="text-[#F97316]">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((o) => (
              <Link
                key={o.id}
                href={`/account/orders/${o.order_number}`}
                className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#161616] px-4 py-3 transition-colors hover:border-[#525252]"
              >
                <div>
                  <p className="font-mono text-sm text-[#F5F5F5]">
                    #{o.order_number}
                  </p>
                  <p className="text-xs text-[#525252]">
                    {new Date(o.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#F97316]">
                    {formatPrice(o.total)}
                  </span>
                  <Badge variant={statusVariant[o.status] ?? "category"}>
                    {o.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/account/profile"
          className="flex items-center gap-3 rounded-lg border border-[#262626] bg-[#161616] p-4 text-sm text-[#A3A3A3] transition-colors hover:border-[#525252] hover:text-[#F5F5F5]"
        >
          <UserIcon className="h-4 w-4 text-[#F97316]" /> Edit Profile
        </Link>
        <Link
          href="/account/addresses"
          className="flex items-center gap-3 rounded-lg border border-[#262626] bg-[#161616] p-4 text-sm text-[#A3A3A3] transition-colors hover:border-[#525252] hover:text-[#F5F5F5]"
        >
          <MapPin className="h-4 w-4 text-[#F97316]" /> Manage Addresses
        </Link>
        <Link
          href="/account/orders"
          className="flex items-center gap-3 rounded-lg border border-[#262626] bg-[#161616] p-4 text-sm text-[#A3A3A3] transition-colors hover:border-[#525252] hover:text-[#F5F5F5]"
        >
          <Package className="h-4 w-4 text-[#F97316]" /> View Orders
        </Link>
      </div>
    </div>
  );
}
