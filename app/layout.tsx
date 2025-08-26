import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SuspenseWrapper from "@/components/SuspenseWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WordyWay - Language Learning App",
  description:
    "Learn languages with interactive vocabulary and pronunciation guides",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
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
      </body>
    </html>
  );
}
