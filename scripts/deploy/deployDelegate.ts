/**
 * Deploy CelebrationsDelegate only.
 * Requires VITE_CELEBRATIONS_BADGE_ADDRESS to be set in .env.
 * Usage: npx hardhat run scripts/deploy/deployDelegate.ts --network luksoTestnet
 */
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const badgeAddress = process.env.VITE_CELEBRATIONS_BADGE_ADDRESS;
  if (!badgeAddress) throw new Error("Set VITE_CELEBRATIONS_BADGE_ADDRESS in .env");

  console.log("Deployer:", deployer.address);
  console.log("Badge contract:", badgeAddress);

  const Delegate = await ethers.getContractFactory("CelebrationsDelegate");
  const delegate = await Delegate.deploy(badgeAddress);
  await delegate.waitForDeployment();
  const addr = await delegate.getAddress();
  console.log("CelebrationsDelegate deployed to:", addr);
  console.log(`VITE_CELEBRATIONS_DELEGATE_ADDRESS=${addr}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
