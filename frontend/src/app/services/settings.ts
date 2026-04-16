/**
 * Settings service — canonical read/write layer for SettingsSchema stored
 * in a Universal Profile's ERC725Y under the "CelebrationsSettings" key.
 *
 * This service is the single source of truth for all settings operations.
 * UI components and hooks must go through this service instead of reading/writing
 * ERC725Y directly.
 *
 * Source of truth hierarchy:
 *   - Structure definition: frontend/src/app/types/settings.ts
 *   - On-chain key:         ERC725Keys.KEY_SETTINGS (Solidity) / "CelebrationsSettings" (erc725.js schema)
 *   - Storage format:       JSONURL pointing to a Pinata-hosted JSON with SettingsSchema shape
 */
import type { Address } from "@/app/types";
import type { SettingsSchema } from "@/app/types/settings";
import { DEFAULT_SETTINGS } from "@/app/types/settings";
import { createERC725 } from "@/lib/erc725";
import { uploadJSONToIPFS } from "@/lib/ipfs";
import { encodeMetadataBytes } from "@/app/services/metadata";
import { keccak256 } from "viem";

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Read a profile's SettingsSchema from ERC725Y.
 * Returns DEFAULT_SETTINGS if the key is unset or the stored JSON is malformed.
 */
export async function readProfileSettings(
  address: Address,
  chainId: number
): Promise<SettingsSchema> {
  const erc725 = createERC725(address, chainId);
  try {
    const result = await erc725.getData("CelebrationsSettings");
    if (!result.value) return DEFAULT_SETTINGS;
    const raw = result.value as Partial<SettingsSchema>;
    return mergeWithDefaults(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Upload SettingsSchema to IPFS and return the encoded JSONURL bytes
 * ready to be passed to a `setData` transaction on the UP.
 *
 * The caller (hook or component) is responsible for sending the actual
 * ERC725Y setData transaction through the wallet client.
 */
export async function encodeSettingsForWrite(
  settings: SettingsSchema
): Promise<`0x${string}`> {
  const ipfsUrl = await uploadJSONToIPFS(settings, "celebrations-settings");
  const contentHash = keccak256(
    new TextEncoder().encode(JSON.stringify(settings))
  );
  return encodeMetadataBytes(ipfsUrl, contentHash);
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateSettings(settings: Partial<SettingsSchema>): string[] {
  const errors: string[] = [];

  const policy = settings.greetingPolicy;
  if (policy) {
    if (policy.rateLimitHours < 0) errors.push("rateLimitHours must be >= 0");
    if (policy.maxMessageLength < 1 || policy.maxMessageLength > 1000) {
      errors.push("maxMessageLength must be between 1 and 1000");
    }
    if (policy.celebrationWindowDays < 0 || policy.celebrationWindowDays > 30) {
      errors.push("celebrationWindowDays must be between 0 and 30");
    }
  }

  return errors;
}

// ── Internal ──────────────────────────────────────────────────────────────────

function mergeWithDefaults(raw: Partial<SettingsSchema>): SettingsSchema {
  return {
    birthdayVisibility:    raw.birthdayVisibility    ?? DEFAULT_SETTINGS.birthdayVisibility,
    wishlistVisibility:    raw.wishlistVisibility    ?? DEFAULT_SETTINGS.wishlistVisibility,
    enabledCelebrationTypes: raw.enabledCelebrationTypes ?? DEFAULT_SETTINGS.enabledCelebrationTypes,
    greetingPolicy: {
      ...DEFAULT_SETTINGS.greetingPolicy,
      ...raw.greetingPolicy,
    },
    badgePolicy: {
      ...DEFAULT_SETTINGS.badgePolicy,
      ...raw.badgePolicy,
    },
  };
}
