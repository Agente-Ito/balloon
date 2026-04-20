import { randomBytes, randomUUID } from "crypto";
import { createPublicClient, http, recoverMessageAddress } from "viem";
import { getDb } from "../storage/db";
import type { Address } from "../types";

const RPC_URL = process.env.RPC_URL ?? "https://rpc.testnet.lukso.network";
const publicClient = createPublicClient({ transport: http(RPC_URL) });

const REMINDER_SYNC_ABI = [
  {
    name: "getPermissionsFor",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "controller", type: "address" }],
    outputs: [{ name: "permissions", type: "bytes32" }],
  },
] as const;

const ZERO_PERMISSIONS = "0x0000000000000000000000000000000000000000000000000000000000000000";
const CHALLENGE_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SyncedReminderRecord {
  profileAddress: Address;
  reminders: unknown[];
  updatedAt: number;
  updatedBy: Address;
}

export function createReminderSyncChallenge(profileAddress: Address, signerAddress: Address) {
  const db = getDb();
  const challengeId = randomUUID();
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + CHALLENGE_TTL_SECONDS;
  const message = [
    "Balloon reminder backup",
    `Profile: ${profileAddress.toLowerCase()}`,
    `Signer: ${signerAddress.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    "",
    "Sign to back up or restore your local reminders.",
  ].join("\n");

  db.prepare("DELETE FROM reminder_sync_challenges WHERE expires_at <= unixepoch() OR consumed_at IS NOT NULL").run();
  db.prepare(`
    INSERT INTO reminder_sync_challenges (id, profile_address, signer_address, nonce, message, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(challengeId, profileAddress.toLowerCase(), signerAddress.toLowerCase(), nonce, message, expiresAt);

  return { challengeId, message, expiresAt };
}

async function signerControlsProfile(profileAddress: Address, signerAddress: Address) {
  if (profileAddress.toLowerCase() === signerAddress.toLowerCase()) return true;

  try {
    const permissions = await publicClient.readContract({
      address: profileAddress,
      abi: REMINDER_SYNC_ABI,
      functionName: "getPermissionsFor",
      args: [signerAddress],
    });
    return permissions !== ZERO_PERMISSIONS;
  } catch {
    return false;
  }
}

export async function createReminderSyncSession(challengeId: string, signature: `0x${string}`) {
  const db = getDb();
  const challenge = db.prepare(`
    SELECT id, profile_address, signer_address, message, expires_at, consumed_at
    FROM reminder_sync_challenges
    WHERE id = ?
  `).get(challengeId) as {
    id: string;
    profile_address: Address;
    signer_address: Address;
    message: string;
    expires_at: number;
    consumed_at: number | null;
  } | undefined;

  if (!challenge) throw new Error("ReminderSyncChallengeNotFound");
  if (challenge.consumed_at) throw new Error("ReminderSyncChallengeConsumed");
  if (challenge.expires_at <= Math.floor(Date.now() / 1000)) throw new Error("ReminderSyncChallengeExpired");

  const recovered = await recoverMessageAddress({
    message: challenge.message,
    signature,
  });

  if (recovered.toLowerCase() !== challenge.signer_address.toLowerCase()) {
    throw new Error("ReminderSyncSignerMismatch");
  }

  const authorized = await signerControlsProfile(challenge.profile_address, recovered as Address);
  if (!authorized) throw new Error("ReminderSyncUnauthorizedSigner");

  const token = randomBytes(24).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

  db.prepare("UPDATE reminder_sync_challenges SET consumed_at = unixepoch() WHERE id = ?").run(challengeId);
  db.prepare("DELETE FROM reminder_sync_sessions WHERE expires_at <= unixepoch()").run();
  db.prepare(`
    INSERT INTO reminder_sync_sessions (token, profile_address, signer_address, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(token, challenge.profile_address.toLowerCase(), challenge.signer_address.toLowerCase(), expiresAt);

  return {
    token,
    expiresAt,
    profileAddress: challenge.profile_address,
    signerAddress: challenge.signer_address,
  };
}

export function validateReminderSyncSession(token: string, profileAddress: Address) {
  const db = getDb();
  const session = db.prepare(`
    SELECT token, profile_address, signer_address, expires_at
    FROM reminder_sync_sessions
    WHERE token = ?
  `).get(token) as {
    token: string;
    profile_address: Address;
    signer_address: Address;
    expires_at: number;
  } | undefined;

  if (!session) return null;
  if (session.expires_at <= Math.floor(Date.now() / 1000)) {
    db.prepare("DELETE FROM reminder_sync_sessions WHERE token = ?").run(token);
    return null;
  }
  if (session.profile_address.toLowerCase() !== profileAddress.toLowerCase()) return null;
  return session;
}

export function getSyncedReminders(profileAddress: Address): SyncedReminderRecord | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT profile_address, reminders_json, updated_at, updated_by
    FROM synced_reminders
    WHERE profile_address = ?
  `).get(profileAddress.toLowerCase()) as {
    profile_address: Address;
    reminders_json: string;
    updated_at: number;
    updated_by: Address;
  } | undefined;

  if (!row) return null;
  return {
    profileAddress: row.profile_address,
    reminders: JSON.parse(row.reminders_json),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function saveSyncedReminders(profileAddress: Address, reminders: unknown[], updatedBy: Address) {
  const db = getDb();
  db.prepare(`
    INSERT INTO synced_reminders (profile_address, reminders_json, updated_at, updated_by)
    VALUES (?, ?, unixepoch(), ?)
    ON CONFLICT(profile_address) DO UPDATE SET
      reminders_json = excluded.reminders_json,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  `).run(profileAddress.toLowerCase(), JSON.stringify(reminders), updatedBy.toLowerCase());

  return getSyncedReminders(profileAddress);
}