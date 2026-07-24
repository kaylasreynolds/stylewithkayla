"use client";

import { useMemo, useState } from "react";
import { PHOTOGRAPHY_MODULES, PHOTOGRAPHY_SCENES, type PhotographyModule } from "@/lib/brand-photography/studio-data";

const moduleTypes: PhotographyModule["type"][] = ["wardrobe", "location", "eyeContact", "expression", "camera", "lighting", "composition", "hair"];

const labels: Record<PhotographyModule["type"], string> = {
  wardrobe: "Wardrobe",
  location: "Location",
  eyeContact: "Eye contact",
  expression: "Expression",
  camera: "Camera",
  lighting: "Lighting",
  composition: "Composition",
  hair: "Hairstyle",
};

export default function PhotographyStudio({ foundation }: { foundation: string }) {
  const [sceneId, setSceneId] = useState(PHOTOGRAPHY_SCENES[0].id);
  const scene = PHOTOGRAPHY_SCENES.find((item) => item.id === sceneId) ?? PHOTOGRAPHY_SCENES[0];
  const [selections, setSelections] = useState(scene.defaults);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  function selectScene(nextId: string) {
    const next = PHOTOGRAPHY_SCENES.find((item) => item.id === nextId) ?? PHOTOGRAPHY_SCENES[0];
    setSceneId(next.id);
    setSelections(next.defaults);
  }

  const prompt = useMemo(() => {
    const selectedModules = moduleTypes
      .map((type) => PHOTOGRAPHY_MODULES.find((item) => item.id === selections[type]))
      .filter((item): item is PhotographyModule => Boolean(item));

    return [
      foundation.trim(),
      `SCENE\n${scene.id} — ${scene.name}`,
      `OBJECTIVE\n${scene.objective}`,
      `INTENDED USE\n${scene.intendedUse}`,
      `REQUIRED STORY\n${scene.story}`,
      `REQUIRED EMOTIONS\n${scene.emotions}`,
      ...selectedModules.map((item) => `${labels[item.type].toUpperCase()} — ${item.id} ${item.name}\n${item.prompt}`),
      `SCENE-SPECIFIC AVOIDANCES\n${scene.avoid}`,
      notes.trim() ? `GENERATION NOTES FOR THIS BUILD\n${notes.trim()}` : "",
    ].filter(Boolean).join("\n\n");
  }, [foundation, notes, scene, selections]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section style={{ width: "min(1180px, calc(100% - 32px))", margin: "28px auto 64px" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Brand Photography MVP</p>
        <h1 style={{ margin: 0 }}>Create Image Sequence</h1>
        <p style={{ maxWidth: 760 }}>Choose a scene, confirm the modules, add one-time notes, then copy the assembled prompt.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) minmax(0, 1fr)", gap: 28, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 18 }}>
          <label>
            <strong>Scene</strong>
            <select value={sceneId} onChange={(event) => selectScene(event.target.value)} style={{ width: "100%", minHeight: 46, marginTop: 6, padding: "8px 10px" }}>
              {PHOTOGRAPHY_SCENES.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.name}</option>)}
            </select>
          </label>

          <div style={{ padding: 14, border: "1px solid #d8c8c8", background: "#fff" }}>
            <strong>{scene.objective}</strong>
            <p style={{ marginBottom: 0 }}>{scene.intendedUse}</p>
          </div>

          {moduleTypes.map((type) => (
            <label key={type}>
              <strong>{labels[type]}</strong>
              <select
                value={selections[type]}
                onChange={(event) => setSelections((current) => ({ ...current, [type]: event.target.value }))}
                style={{ width: "100%", minHeight: 44, marginTop: 6, padding: "8px 10px" }}
              >
                {PHOTOGRAPHY_MODULES.filter((item) => item.type === type).map((item) => (
                  <option key={item.id} value={item.id}>{item.id} — {item.name}</option>
                ))}
              </select>
            </label>
          ))}

          <label>
            <strong>Notes for this generation</strong>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={6} style={{ width: "100%", marginTop: 6, padding: 10, boxSizing: "border-box" }} placeholder="Optional one-time instructions for this build." />
          </label>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>Combined Prompt</h2>
            <button type="button" className="button-primary" onClick={copyPrompt}>{copied ? "Copied" : "Copy Prompt"}</button>
          </div>
          <textarea readOnly value={prompt} spellCheck={false} style={{ width: "100%", minHeight: "72vh", padding: 18, border: "1px solid #d8c8c8", background: "#fff", font: "inherit", fontSize: 13, lineHeight: 1.55, boxSizing: "border-box", resize: "vertical" }} />
        </div>
      </div>
    </section>
  );
}
