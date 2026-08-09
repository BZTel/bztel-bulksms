import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bztel.com"),
  title: {
    default: "BZTel - Communication APIs & Custom Software",
    template: "%s | BZTel",
  },
  description: "BZTel provides powerful communication APIs and custom software development services.",
  icons: {
    icon: [
      { url: "/bztel-logo.png", sizes: "192x192", type: "image/png" },
      { url: "/bztel-brand-icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/bztel-logo.png",
    apple: [
      { url: "/bztel-logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "BZTel - Communication APIs & Custom Software",
    description: "BZTel provides powerful communication APIs and custom software development services.",
    url: "https://bztel.com",
    siteName: "BZTel",
    images: [
      {
        url: "https://bztel.com/bztel-logo.png",
        width: 1200,
        height: 630,
        alt: "BZTel Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BZTel - Communication APIs & Custom Software",
    description: "BZTel provides powerful communication APIs and custom software development services.",
    images: ["https://bztel.com/bztel-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/bztel-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/bztel-logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Karla:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/css/styles.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
