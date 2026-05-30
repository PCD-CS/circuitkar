interface PasswordResetProps {
  resetLink: string;
  siteUrl: string;
}

export function PasswordResetEmail({ resetLink, siteUrl }: PasswordResetProps) {
  return `
    <div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;max-width:600px;margin:0 auto;padding:32px 24px;border-radius:8px">
      <div style="margin-bottom:24px">
        <span style="font-family:monospace;font-size:20px;font-weight:bold;color:#F5F5F5">CIRCUIT<span style="color:#F97316">KAR</span></span>
      </div>
      <h1 style="font-size:22px;margin:0 0 8px;color:#F5F5F5">Reset Your Password</h1>
      <p style="color:#A3A3A3;margin:0 0 24px">We received a request to reset your password. Click the button below to set a new one.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetLink}" style="background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Reset Password</a>
      </div>
      <p style="color:#525252;font-size:13px">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #262626;color:#525252;font-size:12px">
        <p>Circuitkar · <a href="${siteUrl}" style="color:#525252">${siteUrl}</a></p>
      </div>
    </div>
  `;
}
