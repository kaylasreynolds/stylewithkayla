"use client";

import { useEffect } from "react";

const privacyPath = "/Legal/privacy";
const termsPath = "/Legal/terms";

function updateFooterLinks() {
  document.querySelectorAll<HTMLAnchorElement>('a[href="#privacy"]').forEach((link) => {
    link.href = privacyPath;
  });

  document.querySelectorAll<HTMLElement>(".footer-bottom").forEach((footerBottom) => {
    if (footerBottom.querySelector(".footer-legal-links")) return;

    const separator = document.createElement("span");
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "|";

    const links = document.createElement("span");
    links.className = "footer-legal-links";

    const privacyLink = document.createElement("a");
    privacyLink.href = privacyPath;
    privacyLink.textContent = "Privacy Policy";

    const termsLink = document.createElement("a");
    termsLink.href = termsPath;
    termsLink.textContent = "Terms of Use";

    links.append(privacyLink, document.createTextNode(" · "), termsLink);
    footerBottom.append(separator, links);
  });
}

export default function FooterLegalLinks() {
  useEffect(() => {
    updateFooterLinks();

    const observer = new MutationObserver(updateFooterLinks);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
