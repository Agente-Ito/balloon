/**
 * Database singleton — opens (or creates) the SQLite file and applies the schema.
 */
import BetterSqlite3 from "better-sqlite3";
import path from "path";
import { createSchema } from "./schema";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "indexer.db");

let _db: BetterSqlite3.Database | null = null;

export function getDb(): BetterSqlite3.Database {
  if (!_db) {
    _db = new BetterSqlite3(DB_PATH);
    createSchema(_db);
  }
  return _db;
}

/** Returns and advances the last indexed block for a named listener */
export function getLastBlock(listener: string): bigint {
  const db = getDb();
  const row = db
    .prepare("SELECT last_block FROM indexer_state WHERE listener = ?")
    .get(listener) as { last_block: number } | undefined;
  return BigInt(row?.last_block ?? 0);
}

export function saveLastBlock(listener: string, blockNumber: bigint): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO indexer_state (listener, last_block, updated_at)
    VALUES (?, ?, unixepoch())
    ON CONFLICT(listener) DO UPDATE SET
      last_block = excluded.last_block,
      updated_at = excluded.updated_at
  `).run(listener, Number(blockNumber));
}
