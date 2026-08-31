import type { ReactNode } from "react";
import "./style-summary.css";
import "./style-summary-shell.css";

export default function StyleSummaryPage() {
  return <StandaloneShell><main className="style-summary-state"><h1>Private link required.</h1><p>Please use the Style Summary link shared with you by Kayla.</p></main></StandaloneShell>;
}

export function StandaloneShell({ children }: { children: ReactNode }) {
  return <div className="style-summary-standalone-shell">{children}</div>;
}
