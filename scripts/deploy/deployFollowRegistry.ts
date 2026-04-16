/**
 * Deploy FollowRegistry (wrapper around the LUKSO LSP26 FollowerSystem).
 * Usage: npx hardhat run scripts/deploy/deployFollowRegistry.ts --network luksoTestnet
 *
 * The LSP26 FollowerSystem addresses:
 *   Mainnet:  0x...  (see https://docs.lukso.tech/contracts/overview/Universal-Profile)
 *   Testnet:  0x...  (check LUKSO docs for the current testnet address)
 *
 * Pass the correct LSP26 address for your target network via LSP26_ADDRESS env var.
 */
import { ethers } from "hardhat";

// Official LUKSO LSP26 FollowerSystem contract addresses
const LSP26_ADDRESSES: Record<number, string> = {
  42:   "0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA", // LUKSO Mainnet
  4201: "0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA", // LUKSO Testnet (same address)
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();
  console.log("Deploying FollowRegistry with:", deployer.address);
  console.log("Network chain ID:", chainId);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "LYX");

  const lsp26Address = process.env.LSP26_ADDRESS ?? LSP26_ADDRESSES[Number(chainId)];
  if (!lsp26Address) {
    throw new Error(
      `No LSP26 address for chain ${chainId}. Set LSP26_ADDRESS env var or add it to LSP26_ADDRESSES.`
    );
  }
  console.log("LSP26 FollowerSystem address:", lsp26Address);

  const Registry = await ethers.getContractFactory("FollowRegistry");
  const registry = await Registry.deploy(lsp26Address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("FollowRegistry:", registryAddress);

  console.log("\n── Add to .env ──────────────────────────────────────────────────────");
  console.log(`VITE_FOLLOW_REGISTRY_ADDRESS=${registryAddress}`);
  console.log("─────────────────────────────────────────────────────────────────────\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
