/**
 * Verify CelebrationsBadge on the LUKSO block explorer.
 * Usage: npx hardhat run scripts/verify/verifyCelebrationsBadge.ts --network luksoTestnet
 */
import { run } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const address = process.env.VITE_CELEBRATIONS_BADGE_ADDRESS;
  if (!address) throw new Error("Set VITE_CELEBRATIONS_BADGE_ADDRESS in .env");

  await run("verify:verify", {
    address,
    constructorArguments: ["0x0000000000000000000000000000000000000000"],
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
