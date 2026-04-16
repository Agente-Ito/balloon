/**
 * Manual deploy script (alternative to Ignition).
 * Usage: npx hardhat run scripts/deploy.ts --network luksoTestnet
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "LYX");

  // 1. Deploy CelebrationsBadge with zero delegate
  const Badge = await ethers.getContractFactory("CelebrationsBadge");
  const badge = await Badge.deploy("0x0000000000000000000000000000000000000000");
  await badge.waitForDeployment();
  const badgeAddress = await badge.getAddress();
  console.log("CelebrationsBadge:", badgeAddress);

  // 2. Deploy GreetingCard
  const Card = await ethers.getContractFactory("GreetingCard");
  const card = await Card.deploy();
  await card.waitForDeployment();
  const cardAddress = await card.getAddress();
  console.log("GreetingCard:", cardAddress);

  // 3. Deploy CelebrationsDelegate
  const Delegate = await ethers.getContractFactory("CelebrationsDelegate");
  const delegate = await Delegate.deploy(badgeAddress);
  await delegate.waitForDeployment();
  const delegateAddress = await delegate.getAddress();
  console.log("CelebrationsDelegate:", delegateAddress);

  // 4. Wire delegate into badge contract
  const tx = await badge.setDelegate(delegateAddress);
  await tx.wait();
  console.log("Badge delegate set to:", delegateAddress);

  console.log("\n── Add these to your .env ──────────────────────────");
  console.log(`VITE_CELEBRATIONS_BADGE_ADDRESS=${badgeAddress}`);
  console.log(`VITE_GREETING_CARD_ADDRESS=${cardAddress}`);
  console.log(`VITE_CELEBRATIONS_DELEGATE_ADDRESS=${delegateAddress}`);
  console.log("────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
