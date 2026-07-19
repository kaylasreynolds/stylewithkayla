import type { Metadata } from "next";
import "./globals.css";
import "./booking-mobile-fixes.css";
import FooterLegalLinks from "./FooterLegalLinks";
import BookingNavLinks from "./BookingNavLinks";
import BookingValidationErrors from "./BookingValidationErrors";

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

const performanceCss = `
  img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .site-logo img {
    width: 184px;
    height: 52px;
    object-fit: contain;
  }

  .summary-icon img {
    width: 38px;
    height: 38px;
  }

  .footer-contact-item img,
  .footer-social-icon img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .site-footer {
    content-visibility: auto;
    contain-intrinsic-size: 700px;
  }

  @media (max-width: 700px) {
    .site-footer {
      contain-intrinsic-size: 1050px;
    }
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <style dangerouslySetInnerHTML={{ __html: performanceCss }} />
      </head>
      <body>
        {children}
        <BookingNavLinks />
        <BookingValidationErrors />
        <FooterLegalLinks />
      </body>
    </html>
  );
}
