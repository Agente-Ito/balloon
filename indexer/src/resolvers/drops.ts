/**
 * Drop resolvers — typed query functions over the SQLite drops/drop_claims tables.
 */
import { getDb } from "../storage/db";
import type { IndexedDrop, IndexedDropClaim } from "../types";

interface DropRow {
  drop_id: string;
  host: string;
  celebration_type: number;
  year: number;
  month: number;
  day: number;
  start_at: number;
  end_at: number | null;
  max_supply: number | null;
  claimed: number;
  name: string;
  image_ipfs: string | null;
  require_follow: number;
  min_followers: number;
  required_lsp7: string;
  required_lsp8: string;
  block_number: number;
}

interface ClaimRow {
  drop_id: string;
  claimer: string;
  token_id: string;
  block_number: number;
}

const UINT8_TO_SLUG: Record<number, string> = {
  0: "birthday",
  1: "profile_anniversary",
  2: "global_holiday",
  3: "custom_event",
};

function rowToDrop(row: DropRow): IndexedDrop {
  const now = Math.floor(Date.now() / 1000);
  const windowOpen =
    (row.start_at === 0 || now >= row.start_at) &&
    (row.end_at === null || now <= row.end_at);
  const supplyOk = row.max_supply === null || row.claimed < row.max_supply;

  return {
    dropId: row.drop_id,
    host: row.host as `0x${string}`,
    celebrationType: (UINT8_TO_SLUG[row.celebration_type] ?? "custom_event") as IndexedDrop["celebrationType"],
    year: row.year,
    month: row.month,
    day: row.day,
    startAt: row.start_at,
    endAt: row.end_at,
    maxSupply: row.max_supply,
    claimed: row.claimed,
    name: row.name,
    imageIPFS: row.image_ipfs,
    requireFollow: row.require_follow === 1,
    minFollowers: row.min_followers,
    requiredLSP7: JSON.parse(row.required_lsp7) as string[],
    requiredLSP8: JSON.parse(row.required_lsp8) as string[],
    blockNumber: row.block_number,
    isActive: windowOpen && supplyOk,
  };
}

/** Fetch all drops, with optional filters */
export function getDrops(opts: {
  host?: string;
  activeOnly?: boolean;
  month?: number;
  day?: number;
  following?: string[];   // list of addresses; returns drops from those hosts
  limit?: number;
}): IndexedDrop[] {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (opts.host) {
    conditions.push("host = ?");
    params.push(opts.host.toLowerCase());
  }

  if (opts.activeOnly) {
    conditions.push("(start_at = 0 OR start_at <= ?)");
    params.push(now);
    conditions.push("(end_at IS NULL OR end_at >= ?)");
    params.push(now);
    conditions.push("(max_supply IS NULL OR claimed < max_supply)");
  }

  if (opts.month !== undefined) {
    conditions.push("month = ?");
    params.push(opts.month);
  }

  if (opts.day !== undefined) {
    conditions.push("day = ?");
    params.push(opts.day);
  }

  if (opts.following && opts.following.length > 0) {
    const placeholders = opts.following.map(() => "?").join(", ");
    conditions.push(`host IN (${placeholders})`);
    params.push(...opts.following.map((a) => a.toLowerCase()));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitClause = opts.limit ? `LIMIT ${opts.limit}` : "";

  const rows = db
    .prepare(`SELECT * FROM drops ${where} ORDER BY block_number DESC ${limitClause}`)
    .all(...params) as DropRow[];

  return rows.map(rowToDrop);
}

/** Fetch a single drop by its dropId */
export function getDropById(dropId: string): IndexedDrop | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM drops WHERE drop_id = ?").get(dropId) as DropRow | undefined;
  return row ? rowToDrop(row) : null;
}

/** Fetch all claims for a given drop */
export function getClaimsForDrop(dropId: string): IndexedDropClaim[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM drop_claims WHERE drop_id = ? ORDER BY block_number DESC")
    .all(dropId) as ClaimRow[];
  return rows.map((r) => ({
    dropId: r.drop_id,
    claimer: r.claimer as `0x${string}`,
    tokenId: r.token_id,
    blockNumber: r.block_number,
  }));
}

/** Fetch all drops claimed by an address */
export function getDropsClaimedBy(claimer: string): IndexedDropClaim[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM drop_claims WHERE claimer = ? ORDER BY block_number DESC")
    .all(claimer.toLowerCase()) as ClaimRow[];
  return rows.map((r) => ({
    dropId: r.drop_id,
    claimer: r.claimer as `0x${string}`,
    tokenId: r.token_id,
    blockNumber: r.block_number,
  }));
}
