import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text, Row, Column,
} from "@react-email/components";

interface Props {
  productName: string;
  productSlug: string;
  customerName?: string;
  position: number;
  siteUrl: string;
}

export function NotifyMeConfirmationEmail({
  productName, productSlug, customerName, position, siteUrl,
}: Props) {
  const firstName = customerName?.split(" ")[0] || "there";

  return (
    <Html>
      <Head />
      <Preview>{"You're #" + position + " on the waitlist for " + productName}</Preview>
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
          <Section style={{ marginBottom: 32 }}>
            <Text style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#F5F5F5", margin: 0 }}>
              {"CIRCUIT"}<span style={{ color: "#F97316" }}>{"KAR"}</span>
            </Text>
          </Section>

          <Section style={{ background: "#161616", border: "1px solid #262626", borderRadius: 12, padding: "32px 28px", marginBottom: 24 }}>
            <Heading as="h1" style={{ color: "#F5F5F5", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>
              {"You're on the list! 🎉"}
            </Heading>
            <Text style={{ color: "#A3A3A3", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
              {"Hi " + firstName + ", you've registered your interest in "}
              <strong style={{ color: "#F97316" }}>{productName}</strong>
              {". We'll notify you the moment it's back in stock."}
            </Text>

            <Section style={{ background: "#1E1E1E", border: "1px solid #F97316", borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
              <Row>
                <Column>
                  <Text style={{ color: "#525252", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Your position</Text>
                  <Text style={{ color: "#F97316", fontSize: 28, fontWeight: 700, fontFamily: "monospace", margin: "4px 0 0" }}>{"#" + position}</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={{ color: "#A3A3A3", fontSize: 13, margin: 0 }}>{"You're in queue"}</Text>
                  <Text style={{ color: "#525252", fontSize: 12, margin: "4px 0 0" }}>One email when it's available</Text>
                </Column>
              </Row>
            </Section>

            <Link
              href={siteUrl + "/products/" + productSlug}
              style={{ display: "inline-block", background: "#F97316", color: "#fff", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              {"View Product →"}
            </Link>
          </Section>

          <Section style={{ textAlign: "center", marginBottom: 24 }}>
            <Link href={siteUrl + "/products"} style={{ color: "#F97316", fontSize: 13, textDecoration: "none" }}>
              {"Browse other components →"}
            </Link>
          </Section>

          <Hr style={{ borderColor: "#262626", margin: "24px 0" }} />
          <Text style={{ color: "#525252", fontSize: 12, margin: 0 }}>
            {"Circuitkar · Electronic Components for Indian Makers"}
            <br />
            {"No spam — just the one restock alert you asked for."}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
