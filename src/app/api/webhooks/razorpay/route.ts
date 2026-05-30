import { NextResponse, type NextRequest } from "next/server";

// Stub receiver. Razorpay is disabled while RAZORPAY_LIVE !== "true".
// Signature verification + order fulfilment land in Phase 2.
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log("[webhook:razorpay] received", {
      live: process.env.RAZORPAY_LIVE === "true",
      length: body.length,
    });
  } catch {
    // ignore parse errors for the stub
  }
  return NextResponse.json({ received: true });
}
