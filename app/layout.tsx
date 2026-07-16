import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Style With Kayla",
  description: "Personal styling support built around your life, needs, and budget.",
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
      </body>
    </html>
  );
}
