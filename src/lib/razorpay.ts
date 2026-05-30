// Razorpay server helpers
import crypto from 'crypto';

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expected === signature;
}

export async function createRazorpayOrder(
  amount: number, // in paise
  currency: string = 'INR',
  receipt: string,
  keyId: string,
  keySecret: string,
) {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({ amount, currency, receipt }),
  });
  if (!response.ok) throw new Error('Failed to create Razorpay order');
  return response.json();
}
