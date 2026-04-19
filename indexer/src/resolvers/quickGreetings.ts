import { getDb } from "../storage/db";

export interface QuickGreetingRow {
  id: number;
  sender: string;
  recipient: string;
  reaction: string;
  message: string | null;
  created_at: number;
}

const ALLOWED_REACTIONS = new Set(["celebrate", "hug", "applause", "party", "sparkle"]);
const QUICK_GREETING_COOLDOWN_SECONDS = Number(process.env.QUICK_GREETING_COOLDOWN_SECONDS ?? 600);

export function createQuickGreeting(params: {
  sender: string;
  recipient: string;
  reaction: string;
  message?: string;
}): QuickGreetingRow {
  const db = getDb();

  const sender = params.sender.toLowerCase();
  const recipient = params.recipient.toLowerCase();
  const reaction = params.reaction.trim().toLowerCase();
  const message = (params.message ?? "").trim().slice(0, 280);

  if (!sender || !recipient) throw new Error("sender and recipient are required");
  if (!sender.startsWith("0x") || !recipient.startsWith("0x")) {
    throw new Error("sender and recipient must be addresses");
  }
  if (sender === recipient) throw new Error("cannot send to self");
  if (!ALLOWED_REACTIONS.has(reaction)) throw new Error("invalid reaction");

  const latest = db.prepare(`
    SELECT created_at
    FROM quick_greetings
    WHERE sender = ? AND recipient = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(sender, recipient) as { created_at: number } | undefined;

  if (latest) {
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - latest.created_at;
    if (elapsed < QUICK_GREETING_COOLDOWN_SECONDS) {
      const remaining = QUICK_GREETING_COOLDOWN_SECONDS - elapsed;
      throw new Error(`QuickGreetingRateLimited:${remaining}`);
    }
  }

  const stmt = db.prepare(`
    INSERT INTO quick_greetings (sender, recipient, reaction, message)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(sender, recipient, reaction, message.length > 0 ? message : null);

  const row = db.prepare(`
    SELECT id, sender, recipient, reaction, message, created_at
    FROM quick_greetings
    WHERE id = ?
  `).get(Number(info.lastInsertRowid)) as QuickGreetingRow;

  return row;
}

export function getQuickGreetingsForRecipient(recipient: string, limit = 25): QuickGreetingRow[] {
  const db = getDb();
  const safeLimit = Math.max(1, Math.min(limit, 100));
  return db.prepare(`
    SELECT id, sender, recipient, reaction, message, created_at
    FROM quick_greetings
    WHERE recipient = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(recipient.toLowerCase(), safeLimit) as QuickGreetingRow[];
}
