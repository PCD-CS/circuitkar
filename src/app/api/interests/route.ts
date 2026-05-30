import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, name")
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
  if (!alreadyRegistered && process.env.RESEND_API_KEY) {
    void sendNotificationEmail(email, name, product.name).catch(() => {});
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
) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "Circuitkar <onboarding@resend.dev>",
    to: email,
    subject: `You're on the list for ${productName}`,
    html: `
      <div style="font-family: sans-serif; color: #111;">
        <h2>Thanks${name ? `, ${name}` : ""}! 🎉</h2>
        <p>You've registered your interest in <strong>${productName}</strong> on Circuitkar.</p>
        <p>We'll email you the moment it's back in stock.</p>
        <p style="color:#888; font-size:12px; margin-top:24px;">— Circuitkar · Components for Builders.</p>
      </div>
    `,
  });

  // Notify the admin if configured
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await resend.emails.send({
      from: "Circuitkar <onboarding@resend.dev>",
      to: adminEmail,
      subject: `New interest: ${productName}`,
      html: `<p>${email}${name ? ` (${name})` : ""} registered interest in <strong>${productName}</strong>.</p>`,
    });
  }
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
