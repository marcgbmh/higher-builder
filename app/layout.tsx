import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "higher art",
  description: "create higher media",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://higher.art"),
  title: "higher art",
  description: "create higher media.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "higher art",
    description: "create higher media.",
    url: "https://higher.art",
    siteName: "higher art",
    images: [
      {
        url: "https://cxjbxntxhvyzensqnaal.supabase.co/storage/v1/object/public/images/og.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "higher art",
    description: "create higher media.",
    images: [
      "https://cxjbxntxhvyzensqnaal.supabase.co/storage/v1/object/public/images/og.png",
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#EBEBEB]">
      <body>{children}</body>
    </html>
  );
}
