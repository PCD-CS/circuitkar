interface NotifyMeConfirmationProps {
  productName: string;
  productSlug: string;
  siteUrl: string;
}

export function NotifyMeConfirmationEmail({ productName, productSlug, siteUrl }: NotifyMeConfirmationProps) {
  return `
    <div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;max-width:600px;margin:0 auto;padding:32px 24px;border-radius:8px">
      <div style="margin-bottom:24px">
        <span style="font-family:monospace;font-size:20px;font-weight:bold;color:#F5F5F5">CIRCUIT<span style="color:#F97316">KAR</span></span>
      </div>
      <h1 style="font-size:22px;margin:0 0 8px;color:#F5F5F5">You're on the list! 🎉</h1>
      <p style="color:#A3A3A3;margin:0 0 24px">You've registered your interest in <strong style="color:#F97316">${productName}</strong>.</p>
      <p style="color:#A3A3A3">We'll email you the moment it's in stock. No spam — just the one notification you asked for.</p>
      <div style="margin:32px 0;text-align:center">
        <a href="${siteUrl}/products/${productSlug}" style="background:#F97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Product</a>
      </div>
      <a href="${siteUrl}/products" style="color:#F97316;font-size:13px">Browse other components →</a>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #262626;color:#525252;font-size:12px">
        <p>Circuitkar · Electronic Components for Indian Makers · <a href="${siteUrl}" style="color:#525252">${siteUrl}</a></p>
      </div>
    </div>
  `;
}
