"use client";

import { useEffect } from "react";

const bookingNavTargets: Record<string, string> = {
  Home: "/",
  Services: "/#services",
  Events: "/#events",
  "About Me": "/#about",
  Contact: "/#contact",
};

export default function BookingNavLinks() {
  useEffect(() => {
    if (window.location.pathname !== "/book") return;

    const links = document.querySelectorAll<HTMLAnchorElement>(
      ".site-header .site-nav a",
    );

    links.forEach((link) => {
      const target = bookingNavTargets[link.textContent?.trim() ?? ""];
      if (target) link.href = target;
    });

    const logo = document.querySelector<HTMLAnchorElement>(
      ".site-header .site-logo",
    );
    if (logo) logo.href = "/";
  }, []);

  return null;
}
