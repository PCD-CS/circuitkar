import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components";

interface ShippingConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  siteUrl: string;
}

export function ShippingConfirmationEmail({
  orderNumber, customerName, courierName, trackingNumber, trackingUrl, siteUrl,
}: ShippingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order #{orderNumber} has shipped!</Preview>
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
          <Heading style={{ color: "#F97316", fontFamily: "monospace", fontSize: 20, marginBottom: 8 }}>
            CIRCUIT<span style={{ color: "#F5F5F5" }}>KAR</span>
          </Heading>
          <Heading as="h2" style={{ color: "#F5F5F5", fontSize: 22, fontWeight: 700, marginTop: 24 }}>
            Your order is on the way! 🚚
          </Heading>
          <Text style={{ color: "#A3A3A3", fontSize: 14, lineHeight: 1.6 }}>
            Hi {customerName}, your order <strong style={{ color: "#F5F5F5" }}>#{orderNumber}</strong> has been shipped.
          </Text>
          {(courierName || trackingNumber) && (
            <Section style={{ background: "#161616", border: "1px solid #262626", borderRadius: 8, padding: "16px 20px", margin: "20px 0" }}>
              {courierName && <Text style={{ color: "#A3A3A3", fontSize: 13, margin: "4px 0" }}>Courier: <strong style={{ color: "#F5F5F5" }}>{courierName}</strong></Text>}
              {trackingNumber && <Text style={{ color: "#A3A3A3", fontSize: 13, margin: "4px 0" }}>AWB: <strong style={{ color: "#F97316", fontFamily: "monospace" }}>{trackingNumber}</strong></Text>}
            </Section>
          )}
          {trackingUrl && (
            <Link href={trackingUrl} style={{ display: "inline-block", background: "#F97316", color: "#fff", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none", marginTop: 4 }}>
              Track Shipment →
            </Link>
          )}
          <Hr style={{ borderColor: "#262626", margin: "24px 0" }} />
          <Link href={`${siteUrl}/account/orders/${orderNumber}`} style={{ color: "#F97316", fontSize: 13 }}>
            View order details →
          </Link>
          <Text style={{ color: "#525252", fontSize: 12, marginTop: 24 }}>
            Circuitkar · hello@circuitkar.in
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
