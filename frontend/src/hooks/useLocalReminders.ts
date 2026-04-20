import { useCallback, useEffect, useState } from "react";
import type { Address, Celebration } from "@/types";

const STORAGE_PREFIX = "celebrations:local-reminders:";

function normalizeReminder(reminder: Celebration): Celebration {
  return {
    ...reminder,
    storage: "local",
    updatedAt: reminder.updatedAt ?? Date.now(),
    deletedAt: reminder.deletedAt ?? null,
  };
}

function getStorageKey(profileAddress: Address) {
  return `${STORAGE_PREFIX}${profileAddress.toLowerCase()}`;
}

function readStoredReminders(profileAddress: Address): Celebration[] {
  try {
    const raw = localStorage.getItem(getStorageKey(profileAddress));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeReminder(item));
  } catch {
    return [];
  }
}

function writeStoredReminders(profileAddress: Address, reminders: Celebration[]) {
  localStorage.setItem(getStorageKey(profileAddress), JSON.stringify(reminders));
}

export function useLocalReminders(profileAddress: Address | null) {
  const [allReminderRecords, setAllReminderRecords] = useState<Celebration[]>([]);

  useEffect(() => {
    if (!profileAddress) {
      setAllReminderRecords([]);
      return;
    }
    setAllReminderRecords(readStoredReminders(profileAddress));
  }, [profileAddress]);

  const saveReminder = useCallback((reminder: Celebration) => {
    if (!profileAddress) return;
    const nextReminders = [
      ...readStoredReminders(profileAddress),
      normalizeReminder({ ...reminder, updatedAt: Date.now(), deletedAt: null }),
    ];
    writeStoredReminders(profileAddress, nextReminders);
    setAllReminderRecords(nextReminders);
  }, [profileAddress]);

  const updateReminder = useCallback((reminder: Celebration) => {
    if (!profileAddress) return;
    const nextReminders = readStoredReminders(profileAddress).map((existing) => (
      existing.id === reminder.id
        ? normalizeReminder({ ...existing, ...reminder, updatedAt: Date.now(), deletedAt: null })
        : existing
    ));
    writeStoredReminders(profileAddress, nextReminders);
    setAllReminderRecords(nextReminders);
  }, [profileAddress]);

  const deleteReminder = useCallback((reminderId: string) => {
    if (!profileAddress) return;
    const timestamp = Date.now();
    const nextReminders = readStoredReminders(profileAddress).map((existing) => (
      existing.id === reminderId
        ? normalizeReminder({ ...existing, updatedAt: timestamp, deletedAt: timestamp })
        : existing
    ));
    writeStoredReminders(profileAddress, nextReminders);
    setAllReminderRecords(nextReminders);
  }, [profileAddress]);

  const replaceReminders = useCallback((nextReminders: Celebration[]) => {
    if (!profileAddress) return;
    const normalized = nextReminders.map((reminder) => normalizeReminder(reminder));
    writeStoredReminders(profileAddress, normalized);
    setAllReminderRecords(normalized);
  }, [profileAddress]);

  const reminders = allReminderRecords.filter((reminder) => !reminder.deletedAt);

  return {
    reminders,
    allReminderRecords,
    saveReminder,
    updateReminder,
    deleteReminder,
    replaceReminders,
  };
}