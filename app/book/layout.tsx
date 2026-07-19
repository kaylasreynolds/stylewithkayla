import type { Metadata } from "next";
import "./book-overrides.css";

export const metadata: Metadata = {
  title: "Book a Complimentary Styling Appointment",
  description:
    "Request a complimentary personal styling appointment with Kayla at Macy's Boise Towne Square.",
  alternates: {
    canonical: "/book",
  },
  openGraph: {
    type: "website",
    url: "/book",
    title: "Book a Complimentary Styling Appointment | Style With Kayla",
    description:
      "Choose a styling service and request an available appointment time with Kayla at Macy's Boise Towne Square.",
    images: [
      {
        url: "/images/Hero-image.png",
        width: 1200,
        height: 630,
        alt: "Kayla beside a rack of styled clothing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a Complimentary Styling Appointment | Style With Kayla",
    description:
      "Choose a styling service and request an available appointment time with Kayla at Macy's Boise Towne Square.",
    images: ["/images/Hero-image.png"],
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
