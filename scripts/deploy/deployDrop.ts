/**
 * Deploy DropBadge + CelebrationsDrop and wire them together.
 * Requires VITE_FOLLOW_REGISTRY_ADDRESS (or FOLLOW_REGISTRY_ADDRESS) in .env.
 *
 * Usage:
 *   npx hardhat run scripts/deploy/deployDrop.ts --network luksoTestnet
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "LYX");

  const followRegistryAddress =
    process.env.FOLLOW_REGISTRY_ADDRESS ??
    process.env.VITE_FOLLOW_REGISTRY_ADDRESS;

  if (!followRegistryAddress) {
    throw new Error("FOLLOW_REGISTRY_ADDRESS not set in .env");
  }

  // 1. Deploy DropBadge (LSP8 for drop claims)
  const DropBadgeFactory = await ethers.getContractFactory("DropBadge");
  const dropBadge = await DropBadgeFactory.deploy();
  await dropBadge.waitForDeployment();
  const dropBadgeAddress = await dropBadge.getAddress();
  console.log("DropBadge:", dropBadgeAddress);

  // 2. Deploy CelebrationsDrop
  const DropFactory = await ethers.getContractFactory("CelebrationsDrop");
  const celebrationsDrop = await DropFactory.deploy(dropBadgeAddress, followRegistryAddress);
  await celebrationsDrop.waitForDeployment();
  const celebrationsDropAddress = await celebrationsDrop.getAddress();
  console.log("CelebrationsDrop:", celebrationsDropAddress);

  // 3. Wire: only CelebrationsDrop can mint DropBadge tokens
  const tx = await dropBadge.setDropMinter(celebrationsDropAddress);
  await tx.wait();
  console.log("DropBadge minter wired to:", celebrationsDropAddress);

  console.log("\n── Copy to frontend/.env ────────────────────────────");
  console.log(`VITE_DROP_BADGE_ADDRESS=${dropBadgeAddress}`);
  console.log(`VITE_CELEBRATIONS_DROP_ADDRESS=${celebrationsDropAddress}`);
  console.log("─────────────────────────────────────────────────────");
  console.log("\n── Copy to indexer/.env ─────────────────────────────");
  console.log(`DROP_BADGE_ADDRESS=${dropBadgeAddress}`);
  console.log(`CELEBRATIONS_DROP_ADDRESS=${celebrationsDropAddress}`);
  console.log("─────────────────────────────────────────────────────\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
