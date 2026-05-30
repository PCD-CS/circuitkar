import { NextResponse, type NextRequest } from "next/server";

// Stub receiver for Shiprocket tracking updates. Activated in Phase 2.
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log("[webhook:shiprocket] received", { length: body.length });
  } catch {
    // ignore parse errors for the stub
  }
  return NextResponse.json({ received: true });
}
