import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Circuitkar";
  const subtitle =
    searchParams.get("subtitle") || "Electronic Components for Indian Makers";
  const price = searchParams.get("price");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          fontFamily: "monospace",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <span
            style={{ color: "#A3A3A3", fontSize: "32px", fontWeight: "bold" }}
          >
            CIRCUIT
          </span>
          <span
            style={{ color: "#F97316", fontSize: "32px", fontWeight: "bold" }}
          >
            KAR
          </span>
        </div>
        <div
          style={{
            color: "#F5F5F5",
            fontSize: "52px",
            fontWeight: "bold",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "20px",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{ color: "#A3A3A3", fontSize: "24px", textAlign: "center" }}
          >
            {subtitle}
          </div>
        )}
        {price && (
          <div
            style={{
              color: "#F97316",
              fontSize: "36px",
              fontWeight: "bold",
              marginTop: "20px",
            }}
          >
            ₹{price}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            color: "#525252",
            fontSize: "18px",
          }}
        >
          circuitkar.in
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #F97316, transparent)",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
