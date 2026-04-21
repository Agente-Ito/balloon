import { useEffect } from "react";
import type { Address } from "@/types";

const INDEXER_URL = (import.meta.env.VITE_INDEXER_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3001/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getVapidPublicKey() {
  const fromEnv = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim();
  if (fromEnv) return fromEnv;

  try {
    const res = await fetch(`${INDEXER_URL}/push/public-key`);
    if (!res.ok) return "";
    const data = await res.json() as { publicKey?: string };
    return data.publicKey ?? "";
  } catch {
    return "";
  }
}

export function useWebPush(profileAddress: Address | null, enabled = true) {
  useEffect(() => {
    if (!enabled || !profileAddress) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!window.isSecureContext) return;

    let cancelled = false;

    const setup = async () => {
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) return;

      if (Notification.permission === "denied") return;
      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const existing = await registration.pushManager.getSubscription();

      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      if (cancelled) return;

      await fetch(`${INDEXER_URL}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileAddress, subscription: subscription.toJSON() }),
      });
    };

    void setup().catch(() => {
      // Ignore push setup failures in unsupported webview environments.
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, profileAddress]);
}
