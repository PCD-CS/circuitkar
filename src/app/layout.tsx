import type { Metadata, Viewport } from "next";
import { Space_Mono, DM_Sans, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { headers } from "next/headers";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ToastProvider } from "@/components/ui/Toast";
import { getSettings } from "@/lib/settings";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-mono",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Circuitkar — Electronic Components for Indian Makers",
    template: "%s | Circuitkar",
  },
  description:
    "Quality electronic components. Fast shipping across India. Trusted by makers, engineers & students.",
  openGraph: {
    type: "website",
    siteName: "Circuitkar",
    title: "Circuitkar — Electronic Components for Indian Makers",
    description:
      "Quality electronic components. Fast shipping across India. Trusted by makers, engineers & students.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Circuitkar — Electronic Components for Indian Makers",
    description: "Quality electronic components. Fast shipping across India.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  const settings = isAdmin ? null : await getSettings();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <body
        className={`${spaceMono.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-body`}
      >
        <ToastProvider>
          {isAdmin ? (
            children
          ) : (
            <>
              <Header />
              <main className="min-h-[60vh]">{children}</main>
              <Footer whatsappNumber={settings!.whatsapp_number} />
              <WhatsAppButton number={settings!.whatsapp_number} />
            </>
          )}
        </ToastProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
