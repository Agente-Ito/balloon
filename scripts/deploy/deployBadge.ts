/**
 * Deploy CelebrationsBadge only.
 * Usage: npx hardhat run scripts/deploy/deployBadge.ts --network luksoTestnet
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Badge = await ethers.getContractFactory("CelebrationsBadge");
  const badge = await Badge.deploy("0x0000000000000000000000000000000000000000");
  await badge.waitForDeployment();
  const addr = await badge.getAddress();
  console.log("CelebrationsBadge deployed to:", addr);
  console.log(`VITE_CELEBRATIONS_BADGE_ADDRESS=${addr}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
