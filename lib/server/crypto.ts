export async function sha256(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
export async function hashPrivateToken(rawToken: string) { return sha256(rawToken); }
export function randomPrivateToken() { const bytes = crypto.getRandomValues(new Uint8Array(32)); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
export function randomPublicReference() { const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return `SWK-${Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => alphabet[b % alphabet.length]).join("")}`; }
