/**
 * backfillProfiles worker — scans all known addresses, reads their UP ERC725Y
 * data (birthday, profileCreatedAt, settings visibility) and upserts the
 * `profiles` table. This powers the social calendar feature.
 *
 * Run as a one-shot script or on a scheduled interval:
 *   ts-node src/workers/backfillProfiles.ts
 *
 * Requires: RPC_URL env var pointing at a LUKSO node.
 */
import { createPublicClient, http } from "viem";
import { getDb } from "../storage/db";

// ── ERC725Y key constants (keccak256 of human-readable key names) ─────────────
// These match the constants in contracts/libraries/ERC725Keys.sol

const KEY_BIRTHDAY =
  "0x4645724f89f252a2307e2e9f2d5a5210c75e2d316688912008dd40b1735ff981" as `0x${string}`;
const KEY_PROFILE_CREATED_AT =
  "0x3ef1cb31cc2f82824c90cdb61b8cfc4897b52db62ea3583af3c484d1472e290c" as `0x${string}`;
const KEY_SETTINGS =
  "0x900f36713dd8e8d81f42cdbc381011538edf5f9bcadb673979a9e54555b8121c" as `0x${string}`;

const GET_DATA_ABI = [
  {
    name: "getData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "dataKey", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes" }],
  },
] as const;

interface ProfileRow {
  address: string;
}

interface SettingsJson {
  birthdayVisible?: "public" | "followers" | "private";
  eventsVisible?: "public" | "followers" | "private";
  notifyFollowers?: boolean;
  reminderFrequency?: "monthly" | "weekly" | "daily";
}

async function readBytes(
  client: ReturnType<typeof createPublicClient>,
  upAddress: `0x${string}`,
  key: `0x${string}`
): Promise<`0x${string}` | null> {
  try {
    const result = await client.readContract({
      address: upAddress,
      abi: GET_DATA_ABI,
      functionName: "getData",
      args: [key],
    });
    if (!result || result === "0x") return null;
    return result as `0x${string}`;
  } catch {
    return null;
  }
}

/** Parse "YYYY-MM-DD" bytes10 into { month, day } */
function parseBirthdayBytes(raw: `0x${string}`): { month: number; day: number } | null {
  try {
    // raw is hex-encoded UTF-8 string: "YYYY-MM-DD" or "--MM-DD"
    const str = Buffer.from(raw.slice(2), "hex").toString("utf8");
    const parts = str.split("-").filter(Boolean);
    if (parts.length < 2) return null;
    const month = parseInt(parts[parts.length - 2], 10);
    const day   = parseInt(parts[parts.length - 1], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day };
  } catch {
    return null;
  }
}

/** Parse uint256 big-endian bytes32 as unix timestamp */
function parseTimestampBytes(raw: `0x${string}`): number | null {
  try {
    const hex = raw.slice(2).replace(/^0+/, "") || "0";
    const ts = parseInt(hex, 16);
    return ts > 0 ? ts : null;
  } catch {
    return null;
  }
}

function decodeJsonUrl(raw: `0x${string}`): string | undefined {
  if (!raw || raw === "0x") return undefined;
  const body = raw.slice(2);
  // JSONURL = 4-byte prefix + 32-byte hash + utf8 URL bytes
  if (!body.startsWith("6f357c6a") || body.length <= 72) return undefined;
  const urlHex = body.slice(72);
  const bytes = urlHex.match(/../g)?.map((b) => parseInt(b, 16));
  if (!bytes?.length) return undefined;
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function resolveIpfsUrl(url: string): string {
  if (!url.startsWith("ipfs://")) return url;
  const gateway = (process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud").replace(/\/$/, "");
  return `${gateway}/ipfs/${url.slice("ipfs://".length)}`;
}

async function parseSettingsBytes(raw: `0x${string}`): Promise<SettingsJson> {
  const url = decodeJsonUrl(raw);
  if (!url) return {};
  try {
    const res = await fetch(resolveIpfsUrl(url));
    if (!res.ok) return {};
    return (await res.json()) as SettingsJson;
  } catch {
    return {};
  }
}

async function backfillProfiles(): Promise<void> {
  const rpcUrl = process.env.RPC_URL ?? "https://rpc.testnet.lukso.network";
  const chainId = Number(process.env.CHAIN_ID ?? 4201);

  const client = createPublicClient({
    transport: http(rpcUrl),
    chain: { id: chainId } as Parameters<typeof createPublicClient>[0]["chain"],
  });

  const db = getDb();

  // Collect all unique addresses that appear in any indexed table
  const addressRows = db.prepare(`
    SELECT DISTINCT address FROM (
      SELECT owner   AS address FROM badges
      UNION
      SELECT recipient AS address FROM greeting_cards
      UNION
      SELECT claimer   AS address FROM drop_claims
      UNION
      SELECT host      AS address FROM drops
    )
  `).all() as ProfileRow[];

  console.log(`[backfill] Scanning ${addressRows.length} unique address(es)`);

  const upsert = db.prepare(`
    INSERT INTO profiles (
      address,
      birthday_month,
      birthday_day,
      up_created_at,
      birthday_vis,
      events_vis,
      notify_followers,
      reminder_frequency,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(address) DO UPDATE SET
      birthday_month = excluded.birthday_month,
      birthday_day   = excluded.birthday_day,
      up_created_at  = excluded.up_created_at,
      birthday_vis   = excluded.birthday_vis,
      events_vis     = excluded.events_vis,
      notify_followers = excluded.notify_followers,
      reminder_frequency = excluded.reminder_frequency,
      updated_at     = unixepoch()
  `);

  let updated = 0;

  for (const row of addressRows) {
    const addr = row.address as `0x${string}`;

    const [birthdayRaw, createdAtRaw, settingsRaw] = await Promise.all([
      readBytes(client, addr, KEY_BIRTHDAY),
      readBytes(client, addr, KEY_PROFILE_CREATED_AT),
      readBytes(client, addr, KEY_SETTINGS),
    ]);

    const birthday   = birthdayRaw   ? parseBirthdayBytes(birthdayRaw)    : null;
    const createdAt  = createdAtRaw  ? parseTimestampBytes(createdAtRaw)  : null;
    const settings   = settingsRaw ? await parseSettingsBytes(settingsRaw) : {};

    upsert.run(
      addr,
      birthday?.month ?? null,
      birthday?.day   ?? null,
      createdAt,
      settings.birthdayVisible ?? "private",
      settings.eventsVisible   ?? "private",
      settings.notifyFollowers === false ? 0 : 1,
      settings.reminderFrequency ?? "monthly"
    );

    updated++;
    if (updated % 10 === 0) {
      console.log(`[backfill] ${updated}/${addressRows.length} profiles processed`);
    }
  }

  console.log(`[backfill] Done — ${updated} profile(s) upserted.`);
}

backfillProfiles().catch(console.error);
