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
        margin: 0,
        padding: "8px 24px 12px",
        borderTop: "1px solid var(--color-divider, #ddd2ca)",
        background: "var(--color-ivory, #fcf9f6)",
        color: "var(--color-gray, #5a5552)",
        fontSize: "12px",
        lineHeight: 1.4,
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
