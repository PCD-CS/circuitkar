import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components";

interface Props {
  productName: string;
  productSlug: string;
  price: number;
  stockCount?: number;
  siteUrl: string;
}

export function NotifyMeRestockEmail({ productName, productSlug, price, stockCount, siteUrl }: Props) {
  const isLowStock = stockCount !== undefined && stockCount > 0 && stockCount <= 10;

  return (
    <Html>
      <Head />
      <Preview>{productName + " is back in stock — grab it before it sells out!"}</Preview>
      <Body style={{ backgroundColor: "#0A0A0A", fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
          <Section style={{ marginBottom: 32 }}>
            <Text style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#F5F5F5", margin: 0 }}>
              {"CIRCUIT"}<span style={{ color: "#F97316" }}>{"KAR"}</span>
            </Text>
          </Section>

          <Section style={{ background: "#161616", border: "1px solid #262626", borderRadius: 12, padding: "32px 28px", marginBottom: 24 }}>
            <Text style={{ background: "#22C55E20", border: "1px solid #22C55E60", borderRadius: 6, color: "#22C55E", fontSize: 12, fontFamily: "monospace", padding: "4px 10px", display: "inline-block", marginBottom: 16 }}>
              {"✓ Back in Stock"}
            </Text>

            <Heading as="h1" style={{ color: "#F5F5F5", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>
              {"Good news — it's available! 🎉"}
            </Heading>

            <Text style={{ color: "#A3A3A3", fontSize: 15, lineHeight: 1.6, margin: "0 0 4px" }}>
              <strong style={{ color: "#F97316" }}>{productName}</strong>{" is now in stock on Circuitkar."}
            </Text>

            <Text style={{ color: "#F97316", fontSize: 28, fontWeight: 700, fontFamily: "monospace", margin: "12px 0 16px" }}>
              {"₹" + price.toLocaleString("en-IN")}
            </Text>

            {isLowStock && (
              <Section style={{ background: "#F59E0B20", border: "1px solid #F59E0B60", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
                <Text style={{ color: "#F59E0B", fontSize: 13, margin: 0 }}>
                  {"⚠️ Only " + stockCount + " units left — order soon before it sells out!"}
                </Text>
              </Section>
            )}

            <Link
              href={siteUrl + "/products/" + productSlug}
              style={{ display: "inline-block", background: "#F97316", color: "#fff", borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}
            >
              {"Buy Now →"}
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
            {"You requested this alert. No further emails unless you register interest again."}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
