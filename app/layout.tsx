import type { Metadata } from "next";
import { Baloo_2, Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";

// Baloo 2 — rounded display font used for the Guidooo wordmark + headings
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

// Nunito — friendly body font from the brand system
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guidooo — Self-guided audio walking tour of Rotterdam",
  description:
    "Skip the tour group and walk Rotterdam like a local. Guidooo is a self-guided audio walking tour to the city's best photo spots and hidden corners — no app to download, no group to keep up with.",
  icons: {
    icon: [{ url: "/brand/guidooo-favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/guidooo-app-icon.svg" }],
  },
};

export const viewport = {
  themeColor: "#E8512A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${nunito.variable} ${geistMono.variable} h-full bg-background antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
