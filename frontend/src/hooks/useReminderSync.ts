import { useCallback, useState } from "react";
import type { WalletClient } from "viem";
import type { Address, Celebration } from "@/types";

const API = (import.meta.env.VITE_INDEXER_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3001/api";
const SESSION_STORAGE_PREFIX = "celebrations:reminder-sync-session:";
const META_STORAGE_PREFIX = "celebrations:reminder-sync-meta:";

interface ReminderSyncSession {
  token: string;
  expiresAt: number;
}

interface ReminderSyncChallenge {
  challengeId: string;
  message: string;
  expiresAt: number;
}

interface SyncedReminderPayload {
  profileAddress: Address;
  reminders: Celebration[];
  updatedAt: number;
  updatedBy: Address;
}

interface ReminderSyncMeta {
  lastSyncedAt: number;
  lastSyncedBy: Address;
}

function getSessionStorageKey(profileAddress: Address) {
  return `${SESSION_STORAGE_PREFIX}${profileAddress.toLowerCase()}`;
}

function getMetaStorageKey(profileAddress: Address) {
  return `${META_STORAGE_PREFIX}${profileAddress.toLowerCase()}`;
}

function readStoredSession(profileAddress: Address): ReminderSyncSession | null {
  try {
    const raw = localStorage.getItem(getSessionStorageKey(profileAddress));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReminderSyncSession;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (parsed.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(profileAddress: Address, session: ReminderSyncSession | null) {
  const key = getSessionStorageKey(profileAddress);
  if (!session) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(session));
}

function readStoredMeta(profileAddress: Address): ReminderSyncMeta | null {
  try {
    const raw = localStorage.getItem(getMetaStorageKey(profileAddress));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReminderSyncMeta;
    if (!parsed?.lastSyncedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredMeta(profileAddress: Address, payload: SyncedReminderPayload) {
  localStorage.setItem(
    getMetaStorageKey(profileAddress),
    JSON.stringify({ lastSyncedAt: payload.updatedAt, lastSyncedBy: payload.updatedBy })
  );
}

function normalizeReminder(reminder: Celebration): Celebration {
  return {
    ...reminder,
    storage: "local",
    updatedAt: reminder.updatedAt ?? 0,
    deletedAt: reminder.deletedAt ?? null,
  };
}

function compareReminderVersion(a: Celebration, b: Celebration) {
  const left = a.updatedAt ?? 0;
  const right = b.updatedAt ?? 0;
  if (left !== right) return left - right;
  if (!!a.deletedAt !== !!b.deletedAt) return a.deletedAt ? 1 : -1;
  return 0;
}

function mergeReminders(localReminders: Celebration[], remoteReminders: Celebration[]) {
  const merged = new Map<string, Celebration>();

  for (const reminder of [...remoteReminders, ...localReminders].map(normalizeReminder)) {
    const existing = merged.get(reminder.id);
    if (!existing || compareReminderVersion(existing, reminder) < 0) {
      merged.set(reminder.id, reminder);
    }
  }

  return Array.from(merged.values()).sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0));
}

export function useReminderSync({
  walletClient,
  profileAddress,
  connectedAccount,
}: {
  walletClient?: WalletClient;
  profileAddress: Address | null;
  connectedAccount: Address | null;
}) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastSyncMeta, setLastSyncMeta] = useState<ReminderSyncMeta | null>(
    profileAddress ? readStoredMeta(profileAddress) : null
  );

  const authenticate = useCallback(async () => {
    if (!walletClient || !profileAddress || !connectedAccount) {
      throw new Error("ReminderSyncWalletRequired");
    }

    const accounts = await walletClient.requestAddresses();
    const signerAddress = (accounts[0] ?? connectedAccount) as Address;

    const challengeRes = await fetch(`${API}/reminder-sync/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileAddress, signerAddress }),
    });
    if (!challengeRes.ok) {
      throw new Error(`ReminderSyncChallengeFailed:${challengeRes.status}`);
    }

    const challenge = await challengeRes.json() as ReminderSyncChallenge;
    const signature = await walletClient.signMessage({
      account: signerAddress,
      message: challenge.message,
    });

    const sessionRes = await fetch(`${API}/reminder-sync/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: challenge.challengeId, signature }),
    });
    if (!sessionRes.ok) {
      const body = await sessionRes.json().catch(() => ({ error: `HTTP ${sessionRes.status}` }));
      throw new Error(String(body.error ?? `HTTP ${sessionRes.status}`));
    }

    const session = await sessionRes.json() as ReminderSyncSession;
    writeStoredSession(profileAddress, session);
    return session.token;
  }, [walletClient, profileAddress, connectedAccount]);

  const authorizedFetch = useCallback(async (path: string, init?: RequestInit) => {
    if (!profileAddress) throw new Error("ReminderSyncProfileRequired");

    let session = readStoredSession(profileAddress);
    let token = session?.token;

    if (!token) {
      token = await authenticate();
    }

    const doFetch = async (bearerToken: string) => fetch(`${API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    let res = await doFetch(token);
    if (res.status === 401) {
      writeStoredSession(profileAddress, null);
      token = await authenticate();
      res = await doFetch(token);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(String(body.error ?? `HTTP ${res.status}`));
    }

    return res;
  }, [authenticate, profileAddress]);

  const backupReminders = useCallback(async (reminders: Celebration[]) => {
    if (!profileAddress) throw new Error("ReminderSyncProfileRequired");
    setIsBackingUp(true);
    try {
      const params = new URLSearchParams({ profile: profileAddress });
      const currentRes = await authorizedFetch(`/reminder-sync/reminders?${params.toString()}`);
      const currentPayload = await currentRes.json() as SyncedReminderPayload;
      const mergedReminders = mergeReminders(reminders, currentPayload.reminders);

      const res = await authorizedFetch("/reminder-sync/reminders", {
        method: "PUT",
        body: JSON.stringify({ profileAddress, reminders: mergedReminders }),
      });
      const payload = await res.json() as SyncedReminderPayload;
      writeStoredMeta(profileAddress, payload);
      setLastSyncMeta({ lastSyncedAt: payload.updatedAt, lastSyncedBy: payload.updatedBy });
      return payload;
    } finally {
      setIsBackingUp(false);
    }
  }, [authorizedFetch, profileAddress]);

  const restoreReminders = useCallback(async (localReminders: Celebration[]) => {
    if (!profileAddress) throw new Error("ReminderSyncProfileRequired");
    setIsRestoring(true);
    try {
      const params = new URLSearchParams({ profile: profileAddress });
      const res = await authorizedFetch(`/reminder-sync/reminders?${params.toString()}`);
      const remotePayload = await res.json() as SyncedReminderPayload;
      const mergedReminders = mergeReminders(localReminders, remotePayload.reminders);

      const saveRes = await authorizedFetch("/reminder-sync/reminders", {
        method: "PUT",
        body: JSON.stringify({ profileAddress, reminders: mergedReminders }),
      });
      const payload = await saveRes.json() as SyncedReminderPayload;
      writeStoredMeta(profileAddress, payload);
      setLastSyncMeta({ lastSyncedAt: payload.updatedAt, lastSyncedBy: payload.updatedBy });
      return payload;
    } finally {
      setIsRestoring(false);
    }
  }, [authorizedFetch, profileAddress]);

  return {
    backupReminders,
    restoreReminders,
    isBackingUp,
    isRestoring,
    lastSyncMeta,
  };
}