import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

function csvEscape(value: string | null | undefined): string {
  const s = value ?? "";
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_interests")
    .select("created_at, email, name, product:products(name, sku)")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = ["Date", "Product", "SKU", "Email", "Name"];
  const rows = (data ?? []).map((r) => {
    const product = r.product as unknown as
      | { name: string; sku: string | null }
      | null;
    return [
      csvEscape(new Date(r.created_at).toISOString()),
      csvEscape(product?.name),
      csvEscape(product?.sku),
      csvEscape(r.email),
      csvEscape(r.name),
    ].join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="circuitkar-interests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
