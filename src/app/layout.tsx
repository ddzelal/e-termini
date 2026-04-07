import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Footer } from "@/components/footer";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://e-termini.com";

export const metadata: Metadata = {
  title: {
    default: "e-termini | Pronađi i rezerviši sportski teren",
    template: "%s | e-termini",
  },
  description:
    "Platforma za rezervaciju sportskih terena u Srbiji. Pronađi klub, izaberi slobodan termin i rezerviši online — brzo, jednostavno, besplatno.",
  keywords: [
    "sportski tereni",
    "rezervacija terena",
    "fudbal",
    "tenis",
    "padel",
    "košarka",
    "Srbija",
    "Beograd",
    "Novi Sad",
    "booking",
    "e-termini",
  ],
  authors: [{ name: "e-termini" }],
  creator: "e-termini",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: SITE_URL,
    siteName: "e-termini",
    title: "e-termini | Pronađi i rezerviši sportski teren",
    description:
      "Platforma za rezervaciju sportskih terena u Srbiji. Pronađi klub, izaberi slobodan termin i rezerviši online.",
  },
  twitter: {
    card: "summary_large_image",
    title: "e-termini | Pronađi i rezerviši sportski teren",
    description:
      "Platforma za rezervaciju sportskih terena u Srbiji. Pronađi klub, izaberi slobodan termin i rezerviši online.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafdf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1f15" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
