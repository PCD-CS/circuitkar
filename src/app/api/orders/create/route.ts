import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerId } from "@/lib/auth";

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CK-${ts}-${rand}`;
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

  // Fetch cart items
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
    .select("quantity, product:products(id, name, price, images)")
    .eq("cart_id", cart.id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
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

  // Fetch customer email
  const { data: { user } } = await supabase.auth.admin.getUserById(customerId);
  const customerEmail = user?.email || "";

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, phone")
    .eq("id", customerId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderItems = cartItems.map((item: any) => ({
    product_id: item.product.id,
    name: item.product.name,
    qty: item.quantity,
    price: item.product.price,
    image: item.product.images?.[0] || null,
  }));

  const orderNumber = generateOrderNumber();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
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
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clear the cart
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);

  return NextResponse.json({ orderNumber, order }, { status: 201 });
}
