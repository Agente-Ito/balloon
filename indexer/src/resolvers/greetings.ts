/**
 * Greeting card resolvers — query functions used by the HTTP API endpoints.
 */
import { getDb } from "../storage/db";

export interface GreetingCardRow {
  token_id: string;
  sender: string;
  recipient: string;
  celebration_type: number;
  ipfs_url: string | null;
  content_hash: string | null;
  block_number: number;
  tx_hash: string;
  indexed_at: number;
}

export function getCardsForRecipient(recipient: string): GreetingCardRow[] {
  return getDb()
    .prepare("SELECT * FROM greeting_cards WHERE recipient = ? ORDER BY block_number DESC")
    .all(recipient.toLowerCase()) as GreetingCardRow[];
}

export function getCardsBySender(sender: string): GreetingCardRow[] {
  return getDb()
    .prepare("SELECT * FROM greeting_cards WHERE sender = ? ORDER BY block_number DESC")
    .all(sender.toLowerCase()) as GreetingCardRow[];
}

export function getCardById(tokenId: string): GreetingCardRow | undefined {
  return getDb()
    .prepare("SELECT * FROM greeting_cards WHERE token_id = ?")
    .get(tokenId) as GreetingCardRow | undefined;
}

export function getRecentCards(limit = 20): GreetingCardRow[] {
  return getDb()
    .prepare("SELECT * FROM greeting_cards ORDER BY block_number DESC LIMIT ?")
    .all(limit) as GreetingCardRow[];
}
