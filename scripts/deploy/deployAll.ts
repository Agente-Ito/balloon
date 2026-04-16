/**
 * Deploy all Celebrations contracts in correct order and wire them together.
 * Usage: npx hardhat run scripts/deploy/deployAll.ts --network luksoTestnet
 */
import { ethers } from "hardhat";

// Official LSP26 FollowerSystem address (same on mainnet and testnet)
const LSP26_ADDRESS =
  process.env.LSP26_ADDRESS ?? "0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "LYX");

  // 1. CelebrationsBadge (delegate wired later)
  const Badge = await ethers.getContractFactory("CelebrationsBadge");
  const badge = await Badge.deploy("0x0000000000000000000000000000000000000000");
  await badge.waitForDeployment();
  const badgeAddress = await badge.getAddress();
  console.log("CelebrationsBadge:", badgeAddress);

  // 2. GreetingCard
  const Card = await ethers.getContractFactory("GreetingCard");
  const card = await Card.deploy();
  await card.waitForDeployment();
  const cardAddress = await card.getAddress();
  console.log("GreetingCard:", cardAddress);

  // 3. CelebrationsDelegate
  const Delegate = await ethers.getContractFactory("CelebrationsDelegate");
  const delegate = await Delegate.deploy(badgeAddress);
  await delegate.waitForDeployment();
  const delegateAddress = await delegate.getAddress();
  console.log("CelebrationsDelegate:", delegateAddress);

  // 4. Wire delegate into badge
  const tx1 = await badge.setDelegate(delegateAddress);
  await tx1.wait();
  console.log("Badge delegate wired to:", delegateAddress);

  // 5. CelebrationRegistry (global festivities)
  const Registry = await ethers.getContractFactory("CelebrationRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  const festivities = await registry.getFestivities();
  console.log(`CelebrationRegistry: ${registryAddress} (${festivities.length} festivities)`);

  // 6. FollowRegistry (LSP26 wrapper)
  const FollowReg = await ethers.getContractFactory("FollowRegistry");
  const followRegistry = await FollowReg.deploy(LSP26_ADDRESS);
  await followRegistry.waitForDeployment();
  const followRegistryAddress = await followRegistry.getAddress();
  console.log("FollowRegistry:", followRegistryAddress, "→ LSP26:", LSP26_ADDRESS);

  // 7. DropBadge (LSP8 for social drop claims)
  const DropBadgeFactory = await ethers.getContractFactory("DropBadge");
  const dropBadge = await DropBadgeFactory.deploy();
  await dropBadge.waitForDeployment();
  const dropBadgeAddress = await dropBadge.getAddress();
  console.log("DropBadge:", dropBadgeAddress);

  // 8. CelebrationsDrop (drop campaign hub)
  const DropFactory = await ethers.getContractFactory("CelebrationsDrop");
  const celebrationsDrop = await DropFactory.deploy(dropBadgeAddress, followRegistryAddress);
  await celebrationsDrop.waitForDeployment();
  const celebrationsDropAddress = await celebrationsDrop.getAddress();
  console.log("CelebrationsDrop:", celebrationsDropAddress);

  // 9. Wire: only CelebrationsDrop can mint DropBadge tokens
  const tx2 = await dropBadge.setDropMinter(celebrationsDropAddress);
  await tx2.wait();
  console.log("DropBadge minter wired to:", celebrationsDropAddress);

  console.log("\n── Copy to frontend/.env ────────────────────────────");
  console.log(`VITE_CELEBRATIONS_BADGE_ADDRESS=${badgeAddress}`);
  console.log(`VITE_GREETING_CARD_ADDRESS=${cardAddress}`);
  console.log(`VITE_CELEBRATIONS_DELEGATE_ADDRESS=${delegateAddress}`);
  console.log(`VITE_CELEBRATION_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`VITE_FOLLOW_REGISTRY_ADDRESS=${followRegistryAddress}`);
  console.log(`VITE_DROP_BADGE_ADDRESS=${dropBadgeAddress}`);
  console.log(`VITE_CELEBRATIONS_DROP_ADDRESS=${celebrationsDropAddress}`);
  console.log("─────────────────────────────────────────────────────");
  console.log("\n── Copy to indexer/.env ─────────────────────────────");
  console.log(`CELEBRATIONS_BADGE_ADDRESS=${badgeAddress}`);
  console.log(`GREETING_CARD_ADDRESS=${cardAddress}`);
  console.log(`CELEBRATIONS_DELEGATE_ADDRESS=${delegateAddress}`);
  console.log(`LSP26_ADDRESS=${LSP26_ADDRESS}`);
  console.log(`DROP_BADGE_ADDRESS=${dropBadgeAddress}`);
  console.log(`CELEBRATIONS_DROP_ADDRESS=${celebrationsDropAddress}`);
  console.log("─────────────────────────────────────────────────────\n");
  console.log("Next: run scripts/registerDelegate.ts with UP_ADDRESS set in .env");
}

main().catch((err) => { console.error(err); process.exit(1); });
