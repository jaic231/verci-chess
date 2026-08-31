import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vercichess.com"),
  title: "Verci Chess — Community Leaderboard",
  description: "Report head-to-head chess results and climb the Verci community leaderboard.",
  openGraph: {
    title: "Verci Chess — Community Leaderboard",
    description: "See the live Verci chess rankings and enter a match.",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verci Chess — Community Leaderboard",
    description: "See the live Verci chess rankings and enter a match.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon-v3.png",
    shortcut: "/favicon-v3.png",
    apple: "/favicon-v3.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
