import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components";

interface OrderCancelledEmailProps {
  orderNumber: string;
  customerName: string;
  reason?: string;
  refundNote?: string;
  siteUrl: string;
}

export function OrderCancelledEmail({
  orderNumber, customerName, reason, refundNote, siteUrl,
}: OrderCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order #{orderNumber} has been cancelled</Preview>
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
          <Heading style={{ color: "#F97316", fontFamily: "monospace", fontSize: 20, marginBottom: 8 }}>
            CIRCUIT<span style={{ color: "#F5F5F5" }}>KAR</span>
          </Heading>
          <Heading as="h2" style={{ color: "#F5F5F5", fontSize: 22, fontWeight: 700, marginTop: 24 }}>
            Order Cancelled
          </Heading>
          <Text style={{ color: "#A3A3A3", fontSize: 14, lineHeight: 1.6 }}>
            Hi {customerName}, your order <strong style={{ color: "#F5F5F5" }}>#{orderNumber}</strong> has been cancelled.
          </Text>
          {reason && (
            <Section style={{ background: "#161616", border: "1px solid #262626", borderRadius: 8, padding: "16px 20px", margin: "20px 0" }}>
              <Text style={{ color: "#A3A3A3", fontSize: 13, margin: 0 }}>Reason: <span style={{ color: "#F5F5F5" }}>{reason}</span></Text>
            </Section>
          )}
          {refundNote ? (
            <Text style={{ color: "#22C55E", fontSize: 14 }}>{refundNote}</Text>
          ) : (
            <Text style={{ color: "#A3A3A3", fontSize: 14 }}>
              If a payment was made, your refund will be initiated within 24 hours and reflect in 5-7 business days.
            </Text>
          )}
          <Hr style={{ borderColor: "#262626", margin: "24px 0" }} />
          <Link href={`${siteUrl}/products`} style={{ display: "inline-block", background: "#F97316", color: "#fff", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Shop again →
          </Link>
          <Text style={{ color: "#525252", fontSize: 12, marginTop: 24 }}>
            Circuitkar · hello@circuitkar.in · Reply to this email if you have questions.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
