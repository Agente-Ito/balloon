/**
 * Verify GreetingCard on the LUKSO block explorer.
 * Usage: npx hardhat run scripts/verify/verifyGreetingCard.ts --network luksoTestnet
 */
import { run } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const address = process.env.VITE_GREETING_CARD_ADDRESS;
  if (!address) throw new Error("Set VITE_GREETING_CARD_ADDRESS in .env");

  await run("verify:verify", { address, constructorArguments: [] });
}

main().catch((err) => { console.error(err); process.exit(1); });
