import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getResendClient, getEmailConfig } from "@/lib/resend";
import { OrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import type { OrderItem, ShippingAddress, StatusHistoryEntry } from "@/types";

/** Generate order number: {PREFIX}-DDMMYY-NNNN */
async function generateOrderNumber(supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>, prefix: string): Promise<{ orderNumber: string; dailySeq: number }> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`;

  // Count today's orders to get the daily sequence
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  const dailySeq = (count ?? 0) + 1;
  const orderNumber = `${prefix}-${dateStr}-${String(dailySeq).padStart(4, "0")}`;
  return { orderNumber, dailySeq };
}

export async function POST(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: {
    addressId: string;
    gstin?: string;
    businessName?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    isTestOrder?: boolean;
    subtotal: number;
    shipping: number;
    gst: number;
    total: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch cart items with stock info
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!cart) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("quantity, product:products(id, name, price, images, in_stock, stock_count)")
    .eq("cart_id", cart.id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // Final stock validation before order creation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const item of cartItems as any[]) {
    const p = item.product;
    if (!p) continue;
    if (!p.in_stock) {
      return NextResponse.json({ error: `"${p.name}" is out of stock.` }, { status: 400 });
    }
    if (p.stock_count > 0 && item.quantity > p.stock_count) {
      return NextResponse.json(
        { error: `Only ${p.stock_count} unit(s) of "${p.name}" available. Please update your cart.` },
        { status: 400 },
      );
    }
  }

  // Fetch address
  const { data: address } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("id", body.addressId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!address) {
    return NextResponse.json({ error: "Address not found." }, { status: 400 });
  }

  // Fetch customer info
  const { data: { user } } = await supabase.auth.admin.getUserById(customerId);
  const customerEmail = user?.email || "";
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, phone")
    .eq("id", customerId)
    .maybeSingle();

  const settings = await getSettings();
  const prefix = settings.order_number_prefix || "CK";

  const { orderNumber, dailySeq } = await generateOrderNumber(supabase as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>, prefix);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderItems = (cartItems as any[]).map((item) => ({
    product_id: item.product.id,
    name: item.product.name,
    qty: item.quantity,
    price: item.product.price,
    image: item.product.images?.[0] || null,
  }));

  const initialHistory: StatusHistoryEntry[] = [
    { status: "confirmed", timestamp: new Date().toISOString(), note: "Order placed" },
  ];

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      daily_sequence: dailySeq,
      customer_id: customerId,
      customer_name: profile?.full_name || address.full_name,
      customer_email: customerEmail,
      customer_phone: profile?.phone || address.phone,
      shipping_address: {
        label: address.label,
        full_name: address.full_name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
      address_id: body.addressId,
      items: orderItems,
      subtotal: body.subtotal,
      shipping_charge: body.shipping,
      total: body.total,
      gstin: body.gstin || null,
      business_name: body.businessName || null,
      status: "confirmed",
      payment_status: "paid",
      razorpay_order_id: body.razorpayOrderId || null,
      razorpay_payment_id: body.razorpayPaymentId || null,
      is_test_order: body.isTestOrder ?? false,
      status_history: initialHistory,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Decrement stock for each purchased product
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const item of cartItems as any[]) {
    const p = item.product;
    if (!p || !p.in_stock) continue;
    const newStock = Math.max(0, (p.stock_count ?? 0) - item.quantity);
    await supabase
      .from("products")
      .update({
        stock_count: newStock,
        in_stock: newStock > 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);

    // Log inventory event
    await supabase.from("inventory_events").insert({
      product_id: p.id,
      event_type: "sale",
      quantity_change: -item.quantity,
      reference_id: orderNumber,
      notes: `Sold via order ${orderNumber}`,
    }).then(() => {}); // fire-and-forget
  }

  // Clear the cart
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);

  // Send order confirmation email
  try {
    const emailConfig = await getEmailConfig();
    if (emailConfig.sendOrderEmails && customerEmail) {
      const resend = await getResendClient();
      if (resend) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";
        const addr = order.shipping_address as ShippingAddress;
        await resend.emails.send({
          from: emailConfig.from,
          to: customerEmail,
          subject: `Order #${orderNumber} confirmed — Circuitkar`,
          react: OrderConfirmationEmail({
            orderNumber,
            customerName: order.customer_name || "there",
            items: orderItems as OrderItem[],
            shippingAddress: addr,
            subtotal: body.subtotal,
            shipping: body.shipping,
            total: body.total,
            siteUrl,
          }),
        });
        // Notify admin
        if (emailConfig.storeEmail) {
          await resend.emails.send({
            from: emailConfig.from,
            to: emailConfig.storeEmail,
            subject: `New order ${orderNumber}${body.isTestOrder ? " [TEST]" : ""} — ₹${body.total.toLocaleString("en-IN")}`,
            html: `<p>New order <strong>${orderNumber}</strong> received${body.isTestOrder ? " <em>(test mode)</em>" : ""}.</p><p>Customer: ${order.customer_name} (${customerEmail})</p><p>Total: ₹${body.total.toLocaleString("en-IN")}</p><p><a href="${siteUrl}/admin/orders/${orderNumber}">View in admin →</a></p>`,
          });
        }
      }
    }
  } catch (err) {
    console.error("Order confirmation email failed:", err);
  }

  return NextResponse.json({ orderNumber, order }, { status: 201 });
}
