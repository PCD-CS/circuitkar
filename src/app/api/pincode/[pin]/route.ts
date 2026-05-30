import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pin: string }> },
) {
  const { pin } = await params;
  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    return NextResponse.json({ error: "Invalid pincode." }, { status: 400 });
  }
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) {
      return NextResponse.json({ error: "Pincode not found." }, { status: 404 });
    }
    const po = entry.PostOffice[0];
    return NextResponse.json({
      city: po.District as string,
      state: po.State as string,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed." }, { status: 502 });
  }
}
