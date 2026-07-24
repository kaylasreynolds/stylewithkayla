"use client";

import { useMemo, useState } from "react";
import { PHOTOGRAPHY_MODULES, PHOTOGRAPHY_SCENES, type PhotographyModule } from "@/lib/brand-photography/studio-data";

const moduleTypes: PhotographyModule["type"][] = ["wardrobe", "location", "eyeContact", "expression", "camera", "lighting", "composition", "hair"];
const labels: Record<PhotographyModule["type"], string> = { wardrobe: "Wardrobe", location: "Location", eyeContact: "Eye contact", expression: "Expression", camera: "Camera", lighting: "Lighting", composition: "Composition", hair: "Hairstyle" };
const reviewAreas = ["identity", "expression", "hair", "skin", "wardrobe", "anatomy", "jewelry", "lighting", "composition", "background", "brand", "technical"] as const;
const resultOptions = ["pass", "minor_limitation", "fail", "not_applicable"];

type Asset = { id: string; name: string; sceneId: string; promptBuildId: string; orientation: string; approvalStatus: string; approvedUses: string[]; originalFilename: string; sizeBytes: number };

async function readApi(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? "The request failed.");
  return body.data;
}

export default function PhotographyStudio({ foundation }: { foundation: string }) {
  const [sceneId, setSceneId] = useState(PHOTOGRAPHY_SCENES[0].id);
  const scene = PHOTOGRAPHY_SCENES.find((item) => item.id === sceneId) ?? PHOTOGRAPHY_SCENES[0];
  const [selections, setSelections] = useState(scene.defaults);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [promptBuildId, setPromptBuildId] = useState("");
  const [processImageId, setProcessImageId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewResults, setReviewResults] = useState<Record<string, string>>(Object.fromEntries(reviewAreas.map((area) => [area, "pass"])));
  const [assets, setAssets] = useState<Asset[]>([]);

  function selectScene(nextId: string) {
    const next = PHOTOGRAPHY_SCENES.find((item) => item.id === nextId) ?? PHOTOGRAPHY_SCENES[0];
    setSceneId(next.id);
    setSelections(next.defaults);
    setPromptBuildId("");
    setProcessImageId("");
  }

  const prompt = useMemo(() => {
    const selectedModules = moduleTypes.map((type) => PHOTOGRAPHY_MODULES.find((item) => item.id === selections[type])).filter((item): item is PhotographyModule => Boolean(item));
    return [foundation.trim(), `SCENE\n${scene.id} — ${scene.name}`, `OBJECTIVE\n${scene.objective}`, `INTENDED USE\n${scene.intendedUse}`, `REQUIRED STORY\n${scene.story}`, `REQUIRED EMOTIONS\n${scene.emotions}`, ...selectedModules.map((item) => `${labels[item.type].toUpperCase()} — ${item.id} ${item.name}\n${item.prompt}`), `SCENE-SPECIFIC AVOIDANCES\n${scene.avoid}`, notes.trim() ? `GENERATION NOTES FOR THIS BUILD\n${notes.trim()}` : ""].filter(Boolean).join("\n\n");
  }, [foundation, notes, scene, selections]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function savePromptBuild() {
    setBusy(true); setStatus("");
    try {
      const data = await readApi(await fetch("/api/admin/photography/prompt-builds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sceneId: scene.id, sceneName: scene.name, moduleSelections: selections, assembledPrompt: prompt, buildNotes: notes }) }));
      setPromptBuildId(data.id); setStatus(`Saved prompt build ${data.id}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save prompt build."); }
    finally { setBusy(false); }
  }

  async function uploadProcessImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const form = new FormData(event.currentTarget); form.set("promptBuildId", promptBuildId);
      const data = await readApi(await fetch("/api/admin/photography/process-images", { method: "POST", body: form }));
      setProcessImageId(data.id); setStatus(`Uploaded process image ${data.id}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to upload process image."); }
    finally { setBusy(false); }
  }

  async function saveReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    const form = new FormData(event.currentTarget);
    try {
      await readApi(await fetch("/api/admin/photography/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ processImageId, results: reviewResults, whatWorks: form.get("whatWorks"), correctionsNeeded: form.get("correctionsNeeded"), refinementInstruction: form.get("refinementInstruction"), decision: form.get("decision") }) }));
      setStatus("Review saved.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save review."); }
    finally { setBusy(false); }
  }

  async function uploadFinalAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const form = new FormData(event.currentTarget); form.set("promptBuildId", promptBuildId); form.set("sceneId", scene.id); form.set("sourceProcessImageId", processImageId);
      const data = await readApi(await fetch("/api/admin/photography/assets", { method: "POST", body: form }));
      setStatus(`Permanent asset ${data.id} saved.`); await loadAssets();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to upload final asset."); }
    finally { setBusy(false); }
  }

  async function loadAssets() {
    try { const data = await readApi(await fetch("/api/admin/photography/assets")); setAssets(data.assets); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Unable to load assets."); }
  }

  const box = { border: "1px solid #d8c8c8", background: "#fff", padding: 18, marginBottom: 24 } as const;
  const input = { width: "100%", minHeight: 42, padding: "8px 10px", boxSizing: "border-box" as const };

  return (
    <section style={{ width: "min(1180px, calc(100% - 32px))", margin: "28px auto 64px" }}>
      <header style={{ marginBottom: 24 }}><p style={{ margin: "0 0 6px", fontWeight: 700 }}>Brand Photography MVP</p><h1 style={{ margin: 0 }}>Create, Review, and Store Images</h1><p>Functional first pass. Save the exact prompt, upload working images, record review notes, and preserve the final master.</p></header>
      {status && <p role="status" style={{ ...box, background: "#fff8f8" }}>{status}</p>}

      <section style={box}>
        <h2>1. Scene and modules</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <label><strong>Scene</strong><select value={sceneId} onChange={(event) => selectScene(event.target.value)} style={input}>{PHOTOGRAPHY_SCENES.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.name}</option>)}</select></label>
          {moduleTypes.map((type) => <label key={type}><strong>{labels[type]}</strong><select value={selections[type]} onChange={(event) => setSelections((current) => ({ ...current, [type]: event.target.value }))} style={input}>{PHOTOGRAPHY_MODULES.filter((item) => item.type === type).map((item) => <option key={item.id} value={item.id}>{item.id} — {item.name}</option>)}</select></label>)}
        </div>
        <label style={{ display: "block", marginTop: 14 }}><strong>Generation notes</strong><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} style={input} /></label>
      </section>

      <section style={box}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" }}><h2>2. Combined prompt</h2><div style={{ display: "flex", gap: 10 }}><button type="button" onClick={savePromptBuild} disabled={busy}>{promptBuildId ? `Saved: ${promptBuildId}` : "Save Prompt Build"}</button><button type="button" className="button-primary" onClick={copyPrompt}>{copied ? "Copied" : "Copy Prompt"}</button></div></div>
        <textarea readOnly value={prompt} rows={24} style={{ ...input, fontFamily: "monospace", fontSize: 12 }} />
      </section>

      <section style={box}>
        <h2>3. Upload process image</h2><p>Generate the image in ChatGPT, download it, then upload the working version here.</p>
        <form onSubmit={uploadProcessImage} style={{ display: "grid", gap: 12 }}><input type="file" name="file" accept="image/jpeg,image/png,image/webp" required /><label>Attempt number<input name="attemptNumber" type="number" min="1" defaultValue="1" style={input} /></label><label>Label<input name="label" placeholder="Original, hair refinement, final candidate..." style={input} /></label><label>Process notes<textarea name="notes" rows={4} style={input} /></label><button disabled={busy || !promptBuildId}>Upload Process Image</button></form>
        {processImageId && <p><strong>Current process image:</strong> {processImageId}</p>}
      </section>

      <section style={box}>
        <h2>4. Review form</h2>
        <form onSubmit={saveReview} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>{reviewAreas.map((area) => <label key={area}><strong style={{ textTransform: "capitalize" }}>{area}</strong><select value={reviewResults[area]} onChange={(event) => setReviewResults((current) => ({ ...current, [area]: event.target.value }))} style={input}>{resultOptions.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>)}</div>
          <label>What works<textarea name="whatWorks" rows={4} style={input} /></label><label>What needs correction<textarea name="correctionsNeeded" rows={4} style={input} /></label><label>Refinement instruction<textarea name="refinementInstruction" rows={6} style={input} /></label><label>Decision<select name="decision" defaultValue="needs_refinement" style={input}><option value="needs_refinement">Needs refinement</option><option value="rejected">Reject</option><option value="final_candidate">Final candidate</option></select></label><button disabled={busy || !processImageId}>Save Review</button>
        </form>
      </section>

      <section style={box}>
        <h2>5. Upload permanent final master</h2><p>This is stored separately from process images and becomes the permanent reusable file.</p>
        <form onSubmit={uploadFinalAsset} style={{ display: "grid", gap: 12 }}><input type="file" name="file" accept="image/jpeg,image/png,image/webp" required /><label>Permanent asset name<input name="name" required style={input} /></label><label>Orientation<select name="orientation" defaultValue="portrait" style={input}><option value="portrait">Portrait</option><option value="landscape">Landscape</option><option value="square">Square</option><option value="vertical">Vertical</option></select></label><label>Approved uses<input name="approvedUses" placeholder="About page, LinkedIn, press" style={input} /></label><label>Final notes<textarea name="finalNotes" rows={4} style={input} /></label><button className="button-primary" disabled={busy || !promptBuildId}>Save Permanent Asset</button></form>
      </section>

      <section style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2>6. Permanent asset library</h2><button type="button" onClick={loadAssets}>Refresh Library</button></div>
        {assets.length === 0 ? <p>No assets loaded yet.</p> : <div style={{ display: "grid", gap: 10 }}>{assets.map((asset) => <article key={asset.id} style={{ borderTop: "1px solid #ddd", paddingTop: 10 }}><strong>{asset.name}</strong><div>{asset.id} · {asset.sceneId} · {asset.orientation}</div><div>{asset.approvedUses.join(", ") || "No uses recorded"}</div><a href={`/api/admin/photography/assets/${asset.id}/file`}>Download permanent master</a></article>)}</div>}
      </section>
    </section>
  );
}
