interface Env {
  PINATA_JWT: string;
  UPLOAD_KV: KVNamespace;
  REQUIRE_SIGNATURE: string;
  MAX_UPLOADS_PER_DAY: string;
  MAX_FILE_SIZE_BYTES: string;
  ALLOWED_ORIGINS: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim());
    const corsOrigin = allowed.includes(origin) ? origin : allowed[0] ?? "*";

    const cors: Record<string, string> = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return jsonRes({ error: "Method not allowed" }, 405, cors);

    const url = new URL(request.url);
    try {
      if (url.pathname === "/upload/file") return await handleFile(request, env, cors);
      if (url.pathname === "/upload/json") return await handleJson(request, env, cors);
      return jsonRes({ error: "Not found" }, 404, cors);
    } catch (err) {
      console.error(err);
      return jsonRes({ error: err instanceof Error ? err.message : "Internal error" }, 500, cors);
    }
  },
};

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleFile(
  request: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const maxPerDay = parseInt(env.MAX_UPLOADS_PER_DAY ?? "20");
  const maxBytes = parseInt(env.MAX_FILE_SIZE_BYTES ?? "10485760");

  if (!(await rateLimit(env.UPLOAD_KV, ip, maxPerDay))) {
    return jsonRes({ error: "Rate limit exceeded. Try again tomorrow." }, 429, cors);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonRes({ error: "Invalid multipart body" }, 400, cors);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return jsonRes({ error: "Missing file field" }, 400, cors);
  if (file.size > maxBytes) {
    return jsonRes({ error: `File too large (max ${maxBytes / 1048576} MB)` }, 413, cors);
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return jsonRes({ error: `File type not allowed: ${file.type}` }, 415, cors);
  }

  const cid = await pinFile(env.PINATA_JWT, file);
  return jsonRes({ cid }, 200, cors);
}

async function handleJson(
  request: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const maxPerDay = parseInt(env.MAX_UPLOADS_PER_DAY ?? "20");

  if (!(await rateLimit(env.UPLOAD_KV, ip, maxPerDay))) {
    return jsonRes({ error: "Rate limit exceeded. Try again tomorrow." }, 429, cors);
  }

  let body: { data: unknown; name: string };
  try {
    body = (await request.json()) as { data: unknown; name: string };
  } catch {
    return jsonRes({ error: "Invalid JSON body" }, 400, cors);
  }

  if (!body.data || typeof body.name !== "string" || !body.name.trim()) {
    return jsonRes({ error: "Missing data or name" }, 400, cors);
  }

  const cid = await pinJson(env.PINATA_JWT, body.data, body.name.trim());
  return jsonRes({ cid }, 200, cors);
}

// ── Pinata ────────────────────────────────────────────────────────────────────

async function pinFile(jwt: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("pinataMetadata", JSON.stringify({ name: file.name }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Pinata: ${await res.text()}`);
  const { IpfsHash } = (await res.json()) as { IpfsHash: string };
  return IpfsHash;
}

async function pinJson(jwt: string, data: unknown, name: string): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ pinataContent: data, pinataMetadata: { name } }),
  });
  if (!res.ok) throw new Error(`Pinata: ${await res.text()}`);
  const { IpfsHash } = (await res.json()) as { IpfsHash: string };
  return IpfsHash;
}

// ── Rate limiting (IP-based, KV-backed) ───────────────────────────────────────

async function rateLimit(kv: KVNamespace, ip: string, max: number): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10); // "2026-04-13"
  const kvKey = `rl:${encodeURIComponent(ip)}:${today}`;
  const current = parseInt((await kv.get(kvKey)) ?? "0");
  if (current >= max) return false;
  await kv.put(kvKey, String(current + 1), { expirationTtl: 172_800 }); // 2 days TTL
  return true;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonRes(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
