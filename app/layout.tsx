import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SuspenseWrapper from "@/components/SuspenseWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Providers from "@/app/providers";
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Brand Name — Value Proposition",
    template: "%s | Brand Name",
  },
  description: "One-line compelling description (≤160 chars).",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Brand Name",
    title: "Brand Name — Value Proposition",
    description: "One-line compelling description.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Open Graph Image" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@yourhandle",
    creator: "@yourhandle",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <ThemeProvider>
            <ErrorBoundary>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <SuspenseWrapper>{children}</SuspenseWrapper>
                </main>
              </div>
            </ErrorBoundary>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
