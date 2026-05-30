import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import type { OrderItem, ShippingAddress } from "@/types";

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  total: number;
  siteUrl?: string;
}

const bg = "#0A0A0A";
const card = "#161616";
const border = "#262626";
const accent = "#F97316";
const textPrimary = "#F5F5F5";
const textSecondary = "#A3A3A3";

function inr(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  shippingAddress,
  subtotal,
  shipping,
  total,
  siteUrl = "https://circuitkar.in",
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order #{orderNumber} confirmed — Circuitkar</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: "Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Section style={{ padding: "0 0 16px" }}>
            <Text style={{ fontSize: "20px", fontWeight: "bold", color: textPrimary, margin: 0 }}>
              CIRCUIT<span style={{ color: accent }}>KAR</span>
            </Text>
          </Section>

          <Section style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: "8px", padding: "24px" }}>
            <Heading style={{ fontSize: "18px", color: textPrimary, margin: "0 0 8px" }}>
              Thanks for your order, {customerName}!
            </Heading>
            <Text style={{ color: textSecondary, fontSize: "14px", margin: "0 0 16px" }}>
              Your order <strong style={{ color: accent }}>#{orderNumber}</strong> is confirmed. We&apos;ll email you when it ships.
            </Text>

            <Hr style={{ borderColor: border, margin: "16px 0" }} />

            {items.map((item, i) => (
              <Row key={i} style={{ marginBottom: "8px" }}>
                <Column>
                  <Text style={{ color: textPrimary, fontSize: "14px", margin: 0 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: textSecondary, fontSize: "12px", margin: 0 }}>
                    Qty {item.qty}
                  </Text>
                </Column>
                <Column align="right">
                  <Text style={{ color: textSecondary, fontSize: "14px", margin: 0 }}>
                    {inr(item.price * item.qty)}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: border, margin: "16px 0" }} />

            <Row>
              <Column>
                <Text style={{ color: textSecondary, fontSize: "14px", margin: "2px 0" }}>Subtotal</Text>
              </Column>
              <Column align="right">
                <Text style={{ color: textPrimary, fontSize: "14px", margin: "2px 0" }}>{inr(subtotal)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={{ color: textSecondary, fontSize: "14px", margin: "2px 0" }}>Shipping</Text>
              </Column>
              <Column align="right">
                <Text style={{ color: textPrimary, fontSize: "14px", margin: "2px 0" }}>
                  {shipping === 0 ? "Free" : inr(shipping)}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={{ color: textPrimary, fontSize: "16px", fontWeight: "bold", margin: "4px 0" }}>Total</Text>
              </Column>
              <Column align="right">
                <Text style={{ color: accent, fontSize: "16px", fontWeight: "bold", margin: "4px 0" }}>{inr(total)}</Text>
              </Column>
            </Row>

            <Hr style={{ borderColor: border, margin: "16px 0" }} />

            <Text style={{ color: textPrimary, fontSize: "14px", fontWeight: "bold", margin: "0 0 4px" }}>
              Shipping to
            </Text>
            <Text style={{ color: textSecondary, fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
              {shippingAddress.line1}
              {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}
              <br />
              {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
            </Text>

            <Section style={{ textAlign: "center", marginTop: "24px" }}>
              <Link
                href={`${siteUrl}/account/orders/${orderNumber}`}
                style={{
                  backgroundColor: accent,
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "bold",
                  textDecoration: "none",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  display: "inline-block",
                }}
              >
                Track Your Order
              </Link>
            </Section>
          </Section>

          <Text style={{ color: "#525252", fontSize: "12px", textAlign: "center", marginTop: "16px" }}>
            Circuitkar · Electronic components for Indian makers
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;
