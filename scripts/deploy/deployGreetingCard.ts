/**
 * Deploy GreetingCard only.
 * Usage: npx hardhat run scripts/deploy/deployGreetingCard.ts --network luksoTestnet
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Card = await ethers.getContractFactory("GreetingCard");
  const card = await Card.deploy();
  await card.waitForDeployment();
  const addr = await card.getAddress();
  console.log("GreetingCard deployed to:", addr);
  console.log(`VITE_GREETING_CARD_ADDRESS=${addr}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
