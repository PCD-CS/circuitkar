import { NextResponse, type NextRequest } from "next/server";
import { getSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  let body: { name: string; email: string; subject: string; message: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { name, email, subject, message } = body;
  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const settings = await getSettings();
  const adminEmail = settings.admin_email || settings.store_email;
  const resendKey = settings.resend_api_key || process.env.RESEND_API_KEY;

  if (!resendKey || !adminEmail) {
    // Log and return success anyway — don't block the user
    console.log(`[Contact Form] From: ${name} <${email}> | Subject: ${subject}`);
    return NextResponse.json({ success: true });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: `Circuitkar Contact <${settings.resend_from_email || "onboarding@resend.dev"}>`,
      to: adminEmail,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family:sans-serif;color:#111;max-width:600px">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr/>
          <div style="white-space:pre-wrap">${message}</div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Contact] Email failed:", err);
  }

  return NextResponse.json({ success: true });
}
