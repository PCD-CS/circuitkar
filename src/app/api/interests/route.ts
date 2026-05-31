import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getEmailConfig } from "@/lib/resend";
import { NotifyMeConfirmationEmail } from "@/lib/emails/notify-me-confirmation";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: { productId?: string; email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { productId, email, name } = body;
  if (!productId || !email) {
    return NextResponse.json(
      { error: "Product and email are required." },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Verify product exists
  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug")
    .eq("id", productId)
    .maybeSingle();
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  // Insert interest (unique on product_id + email)
  const { error: insertError } = await supabase
    .from("product_interests")
    .insert({
      product_id: productId,
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      ip_address: ip,
    });

  let alreadyRegistered = false;
  if (insertError) {
    // 23505 = unique violation -> already on the list
    if (insertError.code === "23505") {
      alreadyRegistered = true;
    } else {
      return NextResponse.json(
        { error: "Could not register interest. Please try again." },
        { status: 500 },
      );
    }
  }

  // Increment cached count only for new interests
  if (!alreadyRegistered) {
    await supabase.rpc("increment_interest_count", { p_product_id: productId });
  }

  // Compute total count & this email's position
  const { count: total } = await supabase
    .from("product_interests")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { data: ordered } = await supabase
    .from("product_interests")
    .select("email, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  const position =
    (ordered?.findIndex(
      (r) => r.email === email.toLowerCase().trim(),
    ) ?? -1) + 1 || total || 1;

  // Fire-and-forget email notification (does not block the response)
  if (!alreadyRegistered) {
    void sendNotificationEmail(email, name, product.name, product.slug ?? product.id, position).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    count: total ?? 0,
    position,
  });
}

async function sendNotificationEmail(
  email: string,
  name: string | undefined,
  productName: string,
  productSlug: string,
  position: number,
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";
  try {
    const [resend, emailConfig] = await Promise.all([getResendClient(), getEmailConfig()]);
    if (!resend) return;

    // Customer confirmation — styled React Email template
    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: `You're on the list for ${productName} — Circuitkar`,
      react: NotifyMeConfirmationEmail({ productName, productSlug, position, customerName: name, siteUrl }),
    });

    // Admin notification
    if (emailConfig.storeEmail) {
      await resend.emails.send({
        from: emailConfig.from,
        to: emailConfig.storeEmail,
        subject: `New interest: ${productName}`,
        html: `<p style="font-family:sans-serif"><strong>${email}</strong>${name ? ` (${name})` : ""} registered interest in <strong>${productName}</strong>. Position #${position}.<br><a href="${siteUrl}/admin/interests">View interests →</a></p>`,
      });
    }
  } catch (e) { console.error("Interest email failed", e); }
}

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { error: "productId is required." },
      { status: 400 },
    );
  }
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("product_interests")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  return NextResponse.json({ count: count ?? 0 });
}
