/**
 * Badge resolvers — query functions used by the HTTP API endpoints.
 */
import { getDb } from "../storage/db";

export interface BadgeRow {
  token_id: string;
  owner: string;
  celebration_type: number;
  year: number;
  soulbound: number;
  ipfs_url: string | null;
  content_hash: string | null;
  block_number: number;
  tx_hash: string;
  indexed_at: number;
}

export function getBadgesForOwner(owner: string): BadgeRow[] {
  return getDb()
    .prepare("SELECT * FROM badges WHERE owner = ? ORDER BY block_number DESC")
    .all(owner.toLowerCase()) as BadgeRow[];
}

export function getBadgeById(tokenId: string): BadgeRow | undefined {
  return getDb()
    .prepare("SELECT * FROM badges WHERE token_id = ?")
    .get(tokenId) as BadgeRow | undefined;
}

export function getRecentBadges(limit = 20): BadgeRow[] {
  return getDb()
    .prepare("SELECT * FROM badges ORDER BY block_number DESC LIMIT ?")
    .all(limit) as BadgeRow[];
}

export function getBadgesByType(celebrationType: number, limit = 50): BadgeRow[] {
  return getDb()
    .prepare("SELECT * FROM badges WHERE celebration_type = ? ORDER BY block_number DESC LIMIT ?")
    .all(celebrationType, limit) as BadgeRow[];
}
