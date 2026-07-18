import type { Metadata } from "next";
import "./globals.css";
import FooterLegalLinks from "./FooterLegalLinks";

export const metadata: Metadata = {
  metadataBase: new URL("https://stylewithkayla.com"),
  title: {
    default: "Style With Kayla | Personal Stylist in Boise",
    template: "%s | Style With Kayla",
  },
  description: "Personal styling support built around your life, needs, and budget.",
  applicationName: "Style With Kayla",
  authors: [{ name: "Kayla Reynolds" }],
  creator: "Kayla Reynolds",
  publisher: "Style With Kayla",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Style With Kayla",
    title: "Style With Kayla | Personal Stylist in Boise",
    description: "Personal styling support built around your life, needs, and budget.",
    locale: "en_US",
    images: [
      {
        url: "/images/Hero-image.png",
        width: 1200,
        height: 630,
        alt: "Style With Kayla personal styling experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Style With Kayla | Personal Stylist in Boise",
    description: "Personal styling support built around your life, needs, and budget.",
    images: ["/images/Hero-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/images/hanger-black.png",
    shortcut: "/images/hanger-black.png",
    apple: "/images/hanger-black.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <FooterLegalLinks />
      </body>
    </html>
  );
}
