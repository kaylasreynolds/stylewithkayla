"use client";

import { useMemo, useState } from "react";
import { PHOTOGRAPHY_MODULES, PHOTOGRAPHY_SCENES, type PhotographyModule } from "@/lib/brand-photography/studio-data";

const moduleTypes: PhotographyModule["type"][] = ["wardrobe", "location", "eyeContact", "expression", "camera", "lighting", "composition", "hair"];
const labels: Record<PhotographyModule["type"], string> = { wardrobe: "Wardrobe", location: "Location", eyeContact: "Eye contact", expression: "Expression", camera: "Camera", lighting: "Lighting", composition: "Composition", hair: "Hairstyle" };
const reviewAreas = [
  ["identity", "Identity looks right"],
  ["hair", "Hair looks right"],
  ["skin", "Skin looks natural"],
  ["wardrobe", "Wardrobe looks right"],
  ["anatomy", "Hands/body look natural"],
  ["overall", "Overall image is usable"],
] as const;

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
  const [chatUrl, setChatUrl] = useState("");
  const [referencePreview, setReferencePreview] = useState("");
  const [referenceName, setReferenceName] = useState("");
  const [copied, setCopied] = useState(false);
  const [notesCopied, setNotesCopied] = useState(false);
  const [promptBuildId, setPromptBuildId] = useState("");
  const [processImageId, setProcessImageId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewResults, setReviewResults] = useState<Record<string, boolean>>(Object.fromEntries(reviewAreas.map(([area]) => [area, true])));
  const [assets, setAssets] = useState<Asset[]>([]);

  function selectScene(nextId: string) {
    const next = PHOTOGRAPHY_SCENES.find((item) => item.id === nextId) ?? PHOTOGRAPHY_SCENES[0];
    setSceneId(next.id);
    setSelections(next.defaults);
    setPromptBuildId("");
    setProcessImageId("");
  }

  function selectReference(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferencePreview(URL.createObjectURL(file));
    setReferenceName(file.name);
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

  async function copyNotesForRewrite(rawNotes: string) {
    const text = `Rewrite these image-edit notes into one precise, preservation-focused editing prompt. Keep every successful part of the current image unchanged. Do not add enhancements that were not requested.\n\n${rawNotes}`;
    await navigator.clipboard.writeText(text);
    setNotesCopied(true);
    window.setTimeout(() => setNotesCopied(false), 1800);
  }

  async function savePromptBuild() {
    setBusy(true); setStatus("");
    try {
      const buildNotes = [notes.trim(), chatUrl.trim() ? `ChatGPT working thread: ${chatUrl.trim()}` : "", referenceName ? `Reference image used: ${referenceName}` : ""].filter(Boolean).join("\n");
      const data = await readApi(await fetch("/api/admin/photography/prompt-builds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sceneId: scene.id, sceneName: scene.name, moduleSelections: selections, assembledPrompt: prompt, buildNotes }) }));
      setPromptBuildId(data.id); setStatus(`Saved prompt build ${data.id}. You can now upload a process image.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save prompt build."); }
    finally { setBusy(false); }
  }

  async function uploadProcessImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!promptBuildId) { setStatus("Save the prompt build before uploading a process image."); return; }
    setBusy(true); setStatus("Uploading process image...");
    try {
      const form = new FormData(event.currentTarget); form.set("promptBuildId", promptBuildId);
      const data = await readApi(await fetch("/api/admin/photography/process-images", { method: "POST", body: form }));
      setProcessImageId(data.id); setStatus(`Uploaded process image ${data.id}. The review form is now active.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to upload process image."); }
    finally { setBusy(false); }
  }

  async function saveReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!processImageId) { setStatus("Upload a process image before saving a review."); return; }
    setBusy(true); setStatus("Saving review...");
    const form = new FormData(event.currentTarget);
    try {
      const results = Object.fromEntries(Object.entries(reviewResults).map(([key, value]) => [key, value ? "yes" : "no"]));
      await readApi(await fetch("/api/admin/photography/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ processImageId, results, whatWorks: form.get("whatWorks"), correctionsNeeded: form.get("correctionsNeeded"), refinementInstruction: form.get("refinementInstruction"), reviewNotes: form.get("reviewNotes"), decision: form.get("decision") }) }));
      setStatus("Review saved successfully.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save review."); }
    finally { setBusy(false); }
  }

  async function uploadFinalAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("Uploading permanent master...");
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

  const box = { border: "1px solid #d8c8c8", background: "#fff", padding: 16, marginBottom: 18 } as const;
  const input = { width: "100%", minHeight: 40, padding: "7px 9px", boxSizing: "border-box" as const };

  return (
    <section style={{ width: "min(1180px, calc(100% - 32px))", margin: "24px auto 64px" }}>
      <header style={{ marginBottom: 18 }}><p style={{ margin: "0 0 6px", fontWeight: 700 }}>Brand Photography MVP</p><h1 style={{ margin: 0 }}>Create, Review, and Store Images</h1></header>
      {status && <p role="status" style={{ ...box, background: "#fff8f8", position: "sticky", top: 8, zIndex: 5 }}>{status}</p>}

      <section style={box}>
        <h2>1. Scene and modules</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          <label><strong>Scene</strong><select value={sceneId} onChange={(event) => selectScene(event.target.value)} style={input}>{PHOTOGRAPHY_SCENES.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.name}</option>)}</select></label>
          {moduleTypes.map((type) => <label key={type}><strong>{labels[type]}</strong><select value={selections[type]} onChange={(event) => setSelections((current) => ({ ...current, [type]: event.target.value }))} style={input}>{PHOTOGRAPHY_MODULES.filter((item) => item.type === type).map((item) => <option key={item.id} value={item.id}>{item.id} — {item.name}</option>)}</select></label>)}
        </div>
        <label style={{ display: "block", marginTop: 10 }}><strong>Generation notes</strong><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} style={input} /></label>
        <label style={{ display: "block", marginTop: 10 }}><strong>Working ChatGPT conversation link</strong><input type="url" value={chatUrl} onChange={(event) => setChatUrl(event.target.value)} placeholder="https://chatgpt.com/c/..." style={input} /></label>
        {chatUrl && <p style={{ marginBottom: 0 }}><a href={chatUrl} target="_blank" rel="noreferrer">Return to this ChatGPT conversation →</a></p>}
      </section>

      <section style={box}>
        <h2>2. Reference image and combined prompt</h2>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 280px) minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
          <div><label><strong>Reference image to attach in ChatGPT</strong><input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectReference} style={{ display: "block", marginTop: 8 }} /></label>{referencePreview ? <img src={referencePreview} alt="Selected prompt reference" style={{ display: "block", width: "100%", maxHeight: 320, objectFit: "contain", marginTop: 10, border: "1px solid #ddd" }} /> : <p>No reference selected.</p>}<p style={{ fontSize: 12 }}>This preview reminds you which image to attach. The prompt copy button copies text only.</p></div>
          <div><div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><h3 style={{ margin: 0 }}>Combined prompt</h3><div style={{ display: "flex", gap: 8 }}><button type="button" onClick={savePromptBuild} disabled={busy}>{promptBuildId ? `Saved: ${promptBuildId}` : "Save Prompt Build"}</button><button type="button" className="button-primary" onClick={copyPrompt}>{copied ? "Copied" : "Copy Prompt"}</button></div></div><textarea readOnly value={prompt} rows={20} style={{ ...input, fontFamily: "monospace", fontSize: 12 }} /></div>
        </div>
      </section>

      <section style={box}>
        <h2>3. Upload process image</h2><p>{promptBuildId ? `Prompt build ${promptBuildId} is ready.` : "Save the prompt build first. The upload button will remain disabled until then."}</p>
        <form onSubmit={uploadProcessImage} style={{ display: "grid", gridTemplateColumns: "2fr 120px 1fr", gap: 10, alignItems: "end" }}><label><strong>Working image</strong><input type="file" name="file" accept="image/jpeg,image/png,image/webp" required style={{ display: "block", marginTop: 8 }} /></label><label><strong>Attempt</strong><input name="attemptNumber" type="number" min="1" defaultValue="1" style={input} /></label><label><strong>Label</strong><input name="label" placeholder="Original, hair edit..." style={input} /></label><label style={{ gridColumn: "1 / -1" }}><strong>Process notes</strong><textarea name="notes" rows={2} style={input} /></label><button style={{ gridColumn: "1 / -1" }} disabled={busy || !promptBuildId}>{busy ? "Working..." : "Upload Process Image"}</button></form>
        {processImageId && <p><strong>Current process image:</strong> {processImageId}</p>}
      </section>

      <section style={box}>
        <h2>4. Quick review</h2>
        <form onSubmit={saveReview} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>{reviewAreas.map(([area, label]) => <label key={area} style={{ display: "flex", justifyContent: "space-between", gap: 8, border: "1px solid #ddd", padding: "8px 10px", alignItems: "center" }}><span>{label}</span><input type="checkbox" checked={reviewResults[area]} onChange={(event) => setReviewResults((current) => ({ ...current, [area]: event.target.checked }))} /></label>)}</div>
          <label><strong>What works</strong><textarea name="whatWorks" rows={2} style={input} /></label>
          <label><strong>My raw notes: what is wrong and what should change</strong><textarea name="correctionsNeeded" rows={3} style={input} id="raw-review-notes" /></label>
          <button type="button" onClick={() => { const value = (document.getElementById("raw-review-notes") as HTMLTextAreaElement | null)?.value ?? ""; copyNotesForRewrite(value); }} disabled={busy}>{notesCopied ? "Copied" : "Copy notes for ChatGPT rewrite"}</button>
          <label><strong>Refined edit instruction</strong><textarea name="refinementInstruction" rows={4} style={input} placeholder="Paste the rewritten instruction from ChatGPT here." /></label>
          <label><strong>Additional review notes</strong><textarea name="reviewNotes" rows={2} style={input} /></label>
          <label><strong>Decision</strong><select name="decision" defaultValue="needs_refinement" style={input}><option value="needs_refinement">Needs refinement</option><option value="rejected">Reject</option><option value="final_candidate">Final candidate</option></select></label>
          <button disabled={busy || !processImageId}>{processImageId ? (busy ? "Saving..." : "Save Review") : "Upload a process image before saving"}</button>
        </form>
      </section>

      <section style={box}>
        <h2>5. Upload permanent final master</h2><p>This file is stored separately and becomes the reusable permanent master.</p>
        <form onSubmit={uploadFinalAsset} style={{ display: "grid", gap: 10 }}><input type="file" name="file" accept="image/jpeg,image/png,image/webp" required /><label>Permanent asset name<input name="name" required style={input} /></label><label>Orientation<select name="orientation" defaultValue="portrait" style={input}><option value="portrait">Portrait</option><option value="landscape">Landscape</option><option value="square">Square</option><option value="vertical">Vertical</option></select></label><label>Approved uses<input name="approvedUses" placeholder="About page, LinkedIn, press" style={input} /></label><label>Final notes<textarea name="finalNotes" rows={2} style={input} /></label><button className="button-primary" disabled={busy || !promptBuildId}>Save Permanent Asset</button></form>
      </section>

      <section style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2>6. Permanent asset library</h2><button type="button" onClick={loadAssets}>Refresh Library</button></div>
        {assets.length === 0 ? <p>No assets loaded yet.</p> : <div style={{ display: "grid", gap: 10 }}>{assets.map((asset) => <article key={asset.id} style={{ borderTop: "1px solid #ddd", paddingTop: 10 }}><strong>{asset.name}</strong><div>{asset.id} · {asset.sceneId} · {asset.orientation}</div><div>{asset.approvedUses.join(", ") || "No uses recorded"}</div><a href={`/api/admin/photography/assets/${asset.id}/file`}>Download permanent master</a></article>)}</div>}
      </section>
    </section>
  );
}
