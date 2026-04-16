/**
 * Print all ERC725Y data keys used by the Celebrations app.
 * Useful for verifying key hashes and debugging.
 *
 * Usage: npx hardhat run scripts/encodeERC725YKeys.ts
 */
import { ethers } from "hardhat";

const keys = [
  "app:celebrations:version",
  "app:celebrations:birthday",
  "app:celebrations:profileCreatedAt",
  "app:celebrations:settings",
  // Array keys: the [] suffix produces the length key
  "app:celebrations:events[]",
  "app:celebrations:wishlist[]",
];

async function main() {
  console.log("── ERC725Y Data Keys (keccak256) ─────────────────────────────────────");
  for (const key of keys) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(key));
    console.log(`${key.padEnd(40)} → ${hash}`);
  }

  // Array element keys: first 16 bytes of array length key + 0x00...00 + 4-byte index
  const eventsLengthKey = ethers.keccak256(ethers.toUtf8Bytes("app:celebrations:events[]"));
  const wishlistLengthKey = ethers.keccak256(ethers.toUtf8Bytes("app:celebrations:wishlist[]"));

  console.log("\n── Array element keys (index 0) ──────────────────────────────────────");
  for (const [name, lengthKey] of [
    ["events[0]", eventsLengthKey],
    ["wishlist[0]", wishlistLengthKey],
  ] as const) {
    const elementKey =
      lengthKey.slice(0, 34) + // first 16 bytes (32 hex chars + "0x" = 34)
      "0000000000000000" +      // 8 zero bytes padding
      "00000000";               // 4-byte index = 0
    console.log(`${name.padEnd(40)} → ${elementKey}`);
  }
}

main().catch(console.error);
