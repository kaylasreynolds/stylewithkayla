"use client";

import { useEffect } from "react";

const privacyPath = "/Legal/privacy";
const termsPath = "/Legal/terms";

export default function FooterLegalLinks() {
  useEffect(() => {
    document.querySelectorAll<HTMLAnchorElement>('a[href="#privacy"]').forEach((link) => {
      link.href = privacyPath;
    });
  }, []);

  return (
    <nav
      aria-label="Legal links"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "10px",
        padding: "0 24px 22px",
        background: "var(--color-charcoal, #1f1f1f)",
        color: "rgba(255, 255, 255, 0.78)",
        fontSize: "12px",
      }}
    >
      <a
        href={privacyPath}
        style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "4px" }}
      >
        Privacy Policy
      </a>
      <span aria-hidden="true">|</span>
      <a
        href={termsPath}
        style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "4px" }}
      >
        Terms of Use
      </a>
    </nav>
  );
}
