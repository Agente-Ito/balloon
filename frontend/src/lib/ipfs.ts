/**
 * IPFS utilities.
 * Uploads JSON/files via the Cloudflare Worker proxy.
 *
 * All content hashes use keccak256 as required by the LSP4 JSONURL standard.
 */
import { keccak256 } from "viem";

const PROXY_URL = (import.meta.env.VITE_IPFS_PROXY_URL as string | undefined)?.replace(/\/$/, "");
const IPFS_GATEWAY = (import.meta.env.VITE_PINATA_GATEWAY as string | undefined) ?? "https://gateway.pinata.cloud";

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadJSONToIPFS(data: object, name: string): Promise<string> {
  // 1. Try proxy worker
  if (PROXY_URL) {
    try {
      const res = await fetch(`${PROXY_URL}/upload/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, name }),
      });
      if (res.ok) {
        const { cid } = await res.json() as { cid: string };
        return `ipfs://${cid}`;
      }
    } catch {
      // Proxy unreachable — fall through
    }
  }

  // 2. Fallback: encode as data URI (no IPFS needed — works for local dev)
  //    Stored as JSONURL with a data: URL; browsers can fetch() data URIs directly.
  const json = JSON.stringify(data);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `data:application/json;base64,${b64}`;
}

export async function uploadFileToIPFS(file: File): Promise<{ url: string; hash: string }> {
  // keccak256 computed client-side — same regardless of upload path
  const buffer = await file.arrayBuffer();
  const hash = keccak256(new Uint8Array(buffer));

  if (PROXY_URL) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${PROXY_URL}/upload/file`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Proxy upload failed: ${await res.text()}`);
    const { cid } = await res.json() as { cid: string };
    return { url: `ipfs://${cid}`, hash };
  }

  // 3. Fallback: encode as data URI so the badge image is still displayable
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let b64 = "";
  for (let i = 0; i < bytes.length; i++) b64 += String.fromCharCode(bytes[i]);
  return { url: `data:${file.type};base64,${btoa(b64)}`, hash };
}

// ── Resolve ───────────────────────────────────────────────────────────────────

export function resolveIPFSUrl(url: string): string {
  if (url.startsWith("ipfs://")) return `${IPFS_GATEWAY}/ipfs/${url.slice(7)}`;
  return url;
}

export async function fetchIPFSJson<T>(url: string): Promise<T> {
  const resolved = resolveIPFSUrl(url);
  const response = await fetch(resolved);
  if (!response.ok) {
    throw new Error(`Failed to fetch IPFS content from ${resolved}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
