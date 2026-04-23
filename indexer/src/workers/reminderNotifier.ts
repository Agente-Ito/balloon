/**
 * Reminder Notifier — scheduled push notification worker.
 *
 * Runs every 5 minutes, scans all synced reminders in the database, and
 * sends a Web Push notification for any reminder whose notify window has
 * arrived.  Uses a dedup table so each (profile, reminderId, date) is only
 * notified once even if the interval fires multiple times.
 *
 * Notify logic:
 *   - Calculate the "notify date" = event date – notifyDaysBefore (default 1).
 *   - For recurring reminders, advance the event date to the current year
 *     (or next year if the date already passed this year).
 *   - If notify date == today AND current server time >= notifyTime → send.
 */

import { getDb } from "../storage/db";
import { sendPushToProfile } from "../resolvers/pushNotifications";

interface StoredReminder {
  id?: string;
  title?: string;
  date?: string;           // "YYYY-MM-DD"
  recurring?: boolean;
  notifyDaysBefore?: number;
  notifyTime?: string;     // "HH:MM"
  deletedAt?: number | null;
}

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Given a stored date string "YYYY-MM-DD" and whether the reminder repeats,
 * return the next effective event date string (current or next occurrence).
 */
function effectiveEventDate(stored: string, recurring: boolean): string {
  const [storedYear, mm, dd] = stored.split("-").map(Number);
  if (!recurring) return stored;

  const now = new Date();
  const thisYear = now.getFullYear();
  const candidate = new Date(thisYear, mm - 1, dd);
  // If the candidate has already passed more than a day ago, use next year
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (candidate < today) {
    return `${thisYear + 1}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return `${thisYear}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/**
 * Subtract `days` from a "YYYY-MM-DD" string.
 */
function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

async function tick(): Promise<void> {
  const db = getDb();
  const today = todayStr();
  const currentTime = currentTimeStr();

  type SyncedRow = { profile_address: string; reminders_json: string };
  const rows = db.prepare("SELECT profile_address, reminders_json FROM synced_reminders").all() as SyncedRow[];

  for (const row of rows) {
    let reminders: StoredReminder[];
    try {
      reminders = JSON.parse(row.reminders_json) as StoredReminder[];
    } catch {
      continue;
    }

    for (const reminder of reminders) {
      // Skip incomplete or deleted reminders
      if (!reminder.id || !reminder.title || !reminder.date) continue;
      if (reminder.deletedAt) continue;

      const recurring = !!reminder.recurring;
      const notifyDaysBefore = reminder.notifyDaysBefore ?? 1;
      const notifyTime = reminder.notifyTime ?? "09:00";

      // Compute effective event date (handles recurring)
      const eventDate = effectiveEventDate(reminder.date, recurring);

      // Compute the day we should send the notification
      const notifyDate = subtractDays(eventDate, notifyDaysBefore);

      if (notifyDate !== today) continue;
      if (currentTime < notifyTime) continue; // not yet reached notify time

      // Deduplication check
      const alreadySent = db
        .prepare(
          "SELECT 1 FROM reminder_notifications_sent WHERE profile_address = ? AND reminder_id = ? AND notification_date = ?"
        )
        .get(row.profile_address, reminder.id, today);

      if (alreadySent) continue;

      // Build notification body
      const [eventYear, eventMonth, eventDay] = eventDate.split("-").map(Number);
      const body =
        notifyDaysBefore === 0
          ? `It's today — ${eventDay}/${eventMonth}/${eventYear}`
          : `In ${notifyDaysBefore} day${notifyDaysBefore > 1 ? "s" : ""} — ${eventDay}/${eventMonth}/${eventYear}`;

      try {
        await sendPushToProfile(row.profile_address as `0x${string}`, {
          title: reminder.title,
          body,
          tag: `reminder-${reminder.id}`,
          url: "/",
        });

        db.prepare(
          "INSERT OR IGNORE INTO reminder_notifications_sent (profile_address, reminder_id, notification_date, sent_at) VALUES (?, ?, ?, unixepoch())"
        ).run(row.profile_address, reminder.id, today);

        console.log(`[reminderNotifier] Sent push: ${row.profile_address} — "${reminder.title}" (${today})`);
      } catch (err) {
        console.error(`[reminderNotifier] Push failed for ${row.profile_address}:`, (err as Error).message);
      }
    }
  }

  // Clean up old dedup records (older than 2 years) to prevent unbounded growth
  db.prepare(
    "DELETE FROM reminder_notifications_sent WHERE notification_date < ?"
  ).run(`${new Date().getFullYear() - 2}-01-01`);
}

export function startReminderNotifier(): void {
  if (!process.env.VAPID_PRIVATE_KEY) {
    console.warn("[reminderNotifier] VAPID_PRIVATE_KEY not set — reminder notifications disabled");
    return;
  }

  void tick().catch((err: Error) => console.error("[reminderNotifier] Initial tick failed:", err.message));
  setInterval(() => void tick().catch((err: Error) => console.error("[reminderNotifier] Tick failed:", err.message)), INTERVAL_MS);
  console.log("[reminderNotifier] Started — checking every 5 minutes");
}
