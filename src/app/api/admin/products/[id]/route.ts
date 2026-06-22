import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getResendClient, getEmailConfig } from "@/lib/resend";
import { NotifyMeRestockEmail } from "@/lib/emails/notify-me-restock";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  delete body.id;
  delete body.created_at;

  const supabase = createAdminClient();

  // Capture previous stock state before update.
  const { data: prev } = await supabase
    .from("products")
    .select("in_stock, stock_count")
    .eq("id", id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("products")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Write an inventory event whenever stock_count changes.
  const prevStock = prev?.stock_count ?? 0;
  const newStock = data.stock_count ?? 0;
  if (newStock !== prevStock) {
    const delta = newStock - prevStock;
    const eventType = prevStock === 0 && newStock > 0 ? "restock" : "adjustment";
    const absVal = Math.abs(delta);
    const direction = delta > 0 ? `+${absVal} added` : `${delta} removed`;
    const note = `${direction} — was ${prevStock}, now ${newStock} (updated via admin)`;
    await supabase.from("inventory_events").insert({
      product_id: id,
      event_type: eventType,
      quantity_change: delta,
      notes: note,
    });
  }

  // Restock notification — only when in_stock flipped false -> true.
  const becameInStock = prev && !prev.in_stock && data.in_stock === true;
  if (becameInStock) {
    try {
      const emailConfig = await getEmailConfig();
      if (emailConfig.sendNotifyMeEmails) {
        const { data: interests } = await supabase
          .from("product_interests")
          .select("email")
          .eq("product_id", id);
        const emails = Array.from(
          new Set(
            (interests ?? [])
              .map((r) => r.email)
              .filter((e): e is string => Boolean(e)),
          ),
        );
        if (emails.length > 0) {
          const resend = await getResendClient();
          if (resend) {
            const siteUrl =
              process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";
            const restockProps = {
              productName: data.name,
              productSlug: data.slug,
              price: data.price,
              stockCount: data.stock_count,
              siteUrl,
            };
            await Promise.allSettled(
              emails.map((email) =>
                resend.emails.send({
                  from: emailConfig.from,
                  to: email,
                  subject: `${data.name} is back in stock — Circuitkar`,
                  react: NotifyMeRestockEmail(restockProps),
                }),
              ),
            );
          }
        }
      }
    } catch (err) {
      console.error("Restock notification failed:", err);
    }
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
