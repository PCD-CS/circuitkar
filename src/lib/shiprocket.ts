// Shiprocket API helpers
let shiprocketToken: string | null = null;

export async function getShiprocketToken(email: string, password: string): Promise<string> {
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  shiprocketToken = data.token;
  return data.token;
}

export async function createShiprocketOrder(orderData: Record<string, unknown>, token: string) {
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  return res.json();
}

export async function trackShiprocketOrder(shipmentId: string, token: string) {
  const res = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.json();
}
