import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ConfirmationProvider } from "@/contexts/ConfirmationContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PublicNavigationWrapper from "@/components/PublicNavigationWrapper";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-playfair",
});

export const viewport: Viewport = {
  themeColor: "#1e2f75",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://chromadiaries.in"),
  title: {
    default: "Chroma Diaries — Creative Sanctuary for Writers Under 18",
    template: "%s | Chroma Diaries",
  },
  description:
    "A premier English-language creative web magazine for youth under 18. Discover authentic stories, poems, essays, thought pieces, and reviews crafted by the next generation of literary minds.",
  keywords: [
    "creative writing",
    "youth magazine",
    "young writers under 18",
    "short stories",
    "poetry",
    "literary essays",
    "Chroma Diaries",
    "English magazine",
  ],
  authors: [{ name: "Chroma Diaries Editorial Collective" }],
  creator: "Chroma Diaries",
  publisher: "Chroma Diaries",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chromadiaries.in",
    siteName: "Chroma Diaries",
    title: "Chroma Diaries — Creative Sanctuary for Writers Under 18",
    description:
      "A creative sanctuary for writers under 18. Fostering the next generation of literary talent through authentic expression, stories, poems, and essays.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chroma Diaries Literary Web Magazine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chroma Diaries — Creative Sanctuary for Writers Under 18",
    description:
      "A creative sanctuary for writers under 18. Discover stories, poems, essays, and youth creative voices.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-emerald-950/85 selection:text-cream-50 bg-cream-50 text-charcoal">
        <AuthProvider>
          <ConfirmationProvider>
            <ToastProvider>
              <PublicNavigationWrapper
                headerSlot={<Header />}
                footerSlot={<Footer />}
              >
                {children}
              </PublicNavigationWrapper>
            </ToastProvider>
          </ConfirmationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
