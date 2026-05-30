interface NotifyMeRestockProps {
  productName: string;
  productSlug: string;
  price: number;
  stockCount?: number;
  siteUrl: string;
}

export function NotifyMeRestockEmail({ productName, productSlug, price, stockCount, siteUrl }: NotifyMeRestockProps) {
  const isLowStock = stockCount !== undefined && stockCount < 10;
  return `
    <div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;max-width:600px;margin:0 auto;padding:32px 24px;border-radius:8px">
      <div style="margin-bottom:24px">
        <span style="font-family:monospace;font-size:20px;font-weight:bold;color:#F5F5F5">CIRCUIT<span style="color:#F97316">KAR</span></span>
      </div>
      <h1 style="font-size:22px;margin:0 0 8px;color:#F5F5F5">Good news! It's back in stock 🎉</h1>
      <p style="color:#A3A3A3;margin:0 0 4px"><strong style="color:#F97316">${productName}</strong> is now available.</p>
      <p style="color:#F97316;font-size:20px;font-weight:bold;margin:12px 0">₹${price.toLocaleString("en-IN")}</p>
      ${isLowStock ? `<div style="background:#F59E0B20;border:1px solid #F59E0B;border-radius:6px;padding:10px 14px;margin-bottom:16px;color:#F59E0B;font-size:13px">⚠️ Only ${stockCount} left in stock — order soon!</div>` : ""}
      <div style="margin:24px 0;text-align:center">
        <a href="${siteUrl}/products/${productSlug}" style="background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Buy Now →</a>
      </div>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #262626;color:#525252;font-size:12px">
        <p>You received this because you registered interest in this product. · <a href="${siteUrl}" style="color:#525252">Circuitkar</a></p>
      </div>
    </div>
  `;
}
