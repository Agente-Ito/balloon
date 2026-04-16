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
  "0x5c1a7add391b788d16a2b04c10b2f01d328e75bcc5fa94f3d49a6c8b17f0d8e6" as `0x${string}`;
const KEY_PROFILE_CREATED_AT =
  "0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3" as `0x${string}`;
const KEY_SETTINGS =
  "0x6a5d6d6f9a2b2e5e7f4a3c1b8e9d2f0a1c4b7e8d3f6a9c2b5e8d1f4a7c0b3e6" as `0x${string}`;

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
    // raw is hex-encoded UTF-8 string: "YYYY-MM-DD" = 10 chars = 20 hex chars + "0x"
    const str = Buffer.from(raw.slice(2), "hex").toString("utf8");
    const parts = str.split("-");
    if (parts.length !== 3) return null;
    const month = parseInt(parts[1], 10);
    const day   = parseInt(parts[2], 10);
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

/** Parse JSONURL metadata bytes and try to extract birthday/events visibility */
function parseSettingsBytes(raw: `0x${string}`): SettingsJson {
  // JSONURL format: 0x6f357c6a + 32-byte hash + IPFS CID bytes
  // We can't fetch IPFS here without extra infra, so return empty defaults.
  // The indexer API will fall back to 'private' if this is empty.
  return {};
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
    INSERT INTO profiles (address, birthday_month, birthday_day, up_created_at, birthday_vis, events_vis, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(address) DO UPDATE SET
      birthday_month = excluded.birthday_month,
      birthday_day   = excluded.birthday_day,
      up_created_at  = excluded.up_created_at,
      birthday_vis   = excluded.birthday_vis,
      events_vis     = excluded.events_vis,
      updated_at     = unixepoch()
  `);

  let updated = 0;

  for (const row of addressRows) {
    const addr = row.address as `0x${string}`;

    const [birthdayRaw, createdAtRaw] = await Promise.all([
      readBytes(client, addr, KEY_BIRTHDAY),
      readBytes(client, addr, KEY_PROFILE_CREATED_AT),
    ]);

    const birthday   = birthdayRaw   ? parseBirthdayBytes(birthdayRaw)    : null;
    const createdAt  = createdAtRaw  ? parseTimestampBytes(createdAtRaw)  : null;
    const settings   = parseSettingsBytes("0x"); // visibility requires IPFS fetch; default private

    upsert.run(
      addr,
      birthday?.month ?? null,
      birthday?.day   ?? null,
      createdAt,
      settings.birthdayVisible ?? "private",
      settings.eventsVisible   ?? "private"
    );

    updated++;
    if (updated % 10 === 0) {
      console.log(`[backfill] ${updated}/${addressRows.length} profiles processed`);
    }
  }

  console.log(`[backfill] Done — ${updated} profile(s) upserted.`);
}

backfillProfiles().catch(console.error);
