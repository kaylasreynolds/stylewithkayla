"use client";

import { useState } from "react";

export default function PromptLibrary({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      style={{
        width: "min(1100px, calc(100% - 32px))",
        margin: "32px auto 64px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              color: "var(--rose-dark)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Brand Photography
          </p>
          <h1 style={{ margin: 0 }}>Master Prompt</h1>
          <p style={{ margin: "8px 0 0", maxWidth: "720px" }}>
            Copy this base prompt, then add the scene-specific wardrobe, location,
            pose, expression, and story instructions beneath it.
          </p>
        </div>

        <button type="button" onClick={copyPrompt} className="button-primary">
          {copied ? "Copied" : "Copy master prompt"}
        </button>
      </div>

      <textarea
        aria-label="Master brand photography prompt"
        readOnly
        value={prompt}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: "70vh",
          padding: "22px",
          border: "1px solid var(--color-divider, #d8c8c8)",
          borderRadius: "8px",
          background: "#fff",
          color: "var(--charcoal)",
          font: "inherit",
          fontSize: "14px",
          lineHeight: 1.65,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
    </section>
  );
}
