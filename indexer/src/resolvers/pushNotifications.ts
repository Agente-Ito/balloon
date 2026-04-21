import webpush, { type PushSubscription } from "web-push";
import { getDb } from "../storage/db";
import type { Address } from "../types";

const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:hello@celebrations.app";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

let vapidConfigured = false;

function isPushConfigured() {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

function ensurePushConfigured() {
  if (vapidConfigured || !isPushConfigured()) return;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
}

export function getPushPublicKey() {
  return VAPID_PUBLIC_KEY;
}

export function savePushSubscription(profileAddress: Address, subscription: PushSubscription, userAgent?: string) {
  const db = getDb();
  const endpoint = subscription.endpoint;
  if (!endpoint) throw new Error("PushSubscriptionMissingEndpoint");

  db.prepare(`
    INSERT INTO push_subscriptions (endpoint, profile_address, subscription_json, user_agent, created_at, updated_at)
    VALUES (?, ?, ?, ?, unixepoch(), unixepoch())
    ON CONFLICT(endpoint) DO UPDATE SET
      profile_address = excluded.profile_address,
      subscription_json = excluded.subscription_json,
      user_agent = excluded.user_agent,
      updated_at = excluded.updated_at
  `).run(endpoint, profileAddress.toLowerCase(), JSON.stringify(subscription), userAgent ?? null);

  return { ok: true, endpoint };
}

export function deletePushSubscription(profileAddress: Address, endpoint: string) {
  const db = getDb();
  db.prepare("DELETE FROM push_subscriptions WHERE profile_address = ? AND endpoint = ?")
    .run(profileAddress.toLowerCase(), endpoint);
  return { ok: true };
}

interface PushPayload {
  title: string;
  body?: string;
  tag?: string;
  url?: string;
  icon?: string;
}

export async function sendPushToProfile(profileAddress: Address, payload: PushPayload) {
  if (!isPushConfigured()) {
    throw new Error("PushNotConfigured");
  }
  ensurePushConfigured();

  const db = getDb();
  const rows = db.prepare(`
    SELECT endpoint, subscription_json
    FROM push_subscriptions
    WHERE profile_address = ?
  `).all(profileAddress.toLowerCase()) as { endpoint: string; subscription_json: string }[];

  if (rows.length === 0) {
    return { ok: true, sent: 0, removed: 0 };
  }

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.tag,
    url: payload.url ?? "/",
    icon: payload.icon ?? "/favicon.svg",
  });

  let sent = 0;
  let removed = 0;

  for (const row of rows) {
    try {
      const sub = JSON.parse(row.subscription_json) as PushSubscription;
      await webpush.sendNotification(sub, message, { TTL: 60 });
      sent += 1;
    } catch (err) {
      const statusCode = typeof err === "object" && err !== null && "statusCode" in err
        ? Number((err as { statusCode?: number }).statusCode)
        : 0;

      if (statusCode === 404 || statusCode === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(row.endpoint);
        removed += 1;
      }
    }
  }

  return { ok: true, sent, removed };
}
