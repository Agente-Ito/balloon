/**
 * Deploy CelebrationRegistry (global festivities on-chain registry).
 * Usage: npx hardhat run scripts/deploy/deployCelebrationRegistry.ts --network luksoTestnet
 *
 * The deployer wallet becomes the registry owner, which can add new festivities.
 * To transfer ownership post-deploy, call registry.transferOwnership(newOwner).
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CelebrationRegistry with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "LYX");

  const Registry = await ethers.getContractFactory("CelebrationRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("CelebrationRegistry:", registryAddress);
  console.log("Owner:", deployer.address);

  // Verify the pre-populated festivities
  const festivities = await registry.getFestivities();
  console.log(`\nPre-populated festivities: ${festivities.length} entries`);
  for (const f of festivities) {
    console.log(`  ${String(f.month).padStart(2, "0")}-${String(f.day).padStart(2, "0")} — ${f.name}`);
  }

  console.log("\n── Add to .env ──────────────────────────────────────────────────────");
  console.log(`VITE_CELEBRATION_REGISTRY_ADDRESS=${registryAddress}`);
  console.log("─────────────────────────────────────────────────────────────────────\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
