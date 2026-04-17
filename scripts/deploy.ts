/**
 * Deploy script for Balloon (formerly Celebrations) contracts.
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network luksoTestnet
 *   npx hardhat run scripts/deploy.ts --network luksoMainnet
 *
 * Optional env vars:
 *   CREATOR_ADDRESS   — UP address to register as LSP4 creator (defaults to deployer EOA)
 *   ADMIN_ADDRESS     — address for indexer seed (informational only, printed at end)
 */
import { ethers } from "hardhat";

// ── LSP4 key constants ────────────────────────────────────────────────────────

// keccak256("LSP4Creators[]") — standard from LSP4 spec
const LSP4_CREATORS_ARRAY_KEY =
  "0x114bd03b3a46d48759680d81ebb2a414fda4d3efbe757aa4e7fbf7a77f68f786";

// First 16 bytes of array key + 12 zeros + 4-byte index (0x00000000)
const LSP4_CREATORS_ELEMENT_0_KEY =
  "0x114bd03b3a46d48759680d81ebb2a41400000000000000000000000000000000";

/**
 * Encode LSP4Creators[] with a single creator address.
 * Returns [keys, values] ready for setDataBatch.
 *
 * LSP2 Array encoding:
 *   - Length value: uint128 → bytes16 (left-padded)
 *   - Element value: address → bytes20 (unpadded, ERC725Y stores raw bytes)
 */
function encodeSingleCreator(creatorAddress: string): [string[], string[]] {
  // Length = 1, encoded as bytes16
  const lengthValue = "0x" + "00".repeat(15) + "01"; // 0x00...01 (16 bytes)

  // Address value: 20 bytes, no padding (ERC725Y address values are stored as bytes20)
  const addrValue = creatorAddress.toLowerCase().replace("0x", "0x");

  return [
    [LSP4_CREATORS_ARRAY_KEY, LSP4_CREATORS_ELEMENT_0_KEY],
    [lengthValue, addrValue],
  ];
}

// ── Deploy ────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Network:         ", network.name, `(chainId ${network.chainId})`);
  console.log("Deployer EOA:    ", deployer.address);
  console.log("Balance:         ", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "LYX");

  // Creator address for LSP4Creators[] — use a UP address if provided
  const creatorAddress: string = (process.env.CREATOR_ADDRESS ?? deployer.address);
  console.log("LSP4 Creator:    ", creatorAddress);
  console.log("");

  const [creatorKeys, creatorValues] = encodeSingleCreator(creatorAddress);

  // ── 1. CelebrationsBadge ─────────────────────────────────────────────────

  const Badge = await ethers.getContractFactory("CelebrationsBadge");
  const badge = await Badge.deploy("0x0000000000000000000000000000000000000000");
  await badge.waitForDeployment();
  const badgeAddress = await badge.getAddress();
  console.log("✓ Balloon Badge (LSP8):          ", badgeAddress);

  // Set LSP4Creators on badge
  await (await (badge as unknown as { setDataBatch: (keys: string[], values: string[]) => Promise<{ wait: () => Promise<void> }> })
    .setDataBatch(creatorKeys, creatorValues)).wait();
  console.log("  └─ LSP4Creators set to", creatorAddress);

  // ── 2. GreetingCard ──────────────────────────────────────────────────────

  const Card = await ethers.getContractFactory("GreetingCard");
  const card = await Card.deploy();
  await card.waitForDeployment();
  const cardAddress = await card.getAddress();
  console.log("✓ Balloon Card (LSP8):           ", cardAddress);

  await (await (card as unknown as { setDataBatch: (keys: string[], values: string[]) => Promise<{ wait: () => Promise<void> }> })
    .setDataBatch(creatorKeys, creatorValues)).wait();
  console.log("  └─ LSP4Creators set to", creatorAddress);

  // ── 3. DropBadge ─────────────────────────────────────────────────────────

  const DropBadge = await ethers.getContractFactory("DropBadge");
  const dropBadge = await DropBadge.deploy();
  await dropBadge.waitForDeployment();
  const dropBadgeAddress = await dropBadge.getAddress();
  console.log("✓ Balloon Drop (LSP8):           ", dropBadgeAddress);

  await (await (dropBadge as unknown as { setDataBatch: (keys: string[], values: string[]) => Promise<{ wait: () => Promise<void> }> })
    .setDataBatch(creatorKeys, creatorValues)).wait();
  console.log("  └─ LSP4Creators set to", creatorAddress);

  // ── 4. CelebrationsDelegate ──────────────────────────────────────────────

  const Delegate = await ethers.getContractFactory("CelebrationsDelegate");
  const delegate = await Delegate.deploy(badgeAddress);
  await delegate.waitForDeployment();
  const delegateAddress = await delegate.getAddress();
  console.log("✓ CelebrationsDelegate (LSP1):   ", delegateAddress);

  // ── 5. Wire delegate into badge ──────────────────────────────────────────

  await (await badge.setDelegate(delegateAddress)).wait();
  console.log("  └─ Badge delegate set");

  // ── 6. CelebrationsDrop + wire DropBadge ────────────────────────────────

  // CelebrationsDrop needs a DropBadge address — deploy and wire
  const Drop = await ethers.getContractFactory("CelebrationsDrop");
  const drop = await Drop.deploy(dropBadgeAddress);
  await drop.waitForDeployment();
  const dropAddress = await drop.getAddress();
  console.log("✓ CelebrationsDrop:              ", dropAddress);

  // Wire DropBadge minter → CelebrationsDrop
  await (await (dropBadge as unknown as { setDropMinter: (addr: string) => Promise<{ wait: () => Promise<void> }> })
    .setDropMinter(dropAddress)).wait();
  console.log("  └─ DropBadge minter set to CelebrationsDrop");

  // ── Output ───────────────────────────────────────────────────────────────

  console.log("\n── Add to frontend .env ────────────────────────────────────");
  console.log(`VITE_CELEBRATIONS_BADGE_ADDRESS=${badgeAddress}`);
  console.log(`VITE_GREETING_CARD_ADDRESS=${cardAddress}`);
  console.log(`VITE_CELEBRATIONS_DELEGATE_ADDRESS=${delegateAddress}`);
  console.log(`VITE_CELEBRATIONS_DROP_ADDRESS=${dropAddress}`);
  console.log(`VITE_DROP_BADGE_ADDRESS=${dropBadgeAddress}`);

  console.log("\n── Add to indexer .env ─────────────────────────────────────");
  console.log(`CELEBRATIONS_BADGE_ADDRESS=${badgeAddress}`);
  console.log(`GREETING_CARD_ADDRESS=${cardAddress}`);
  console.log(`CELEBRATIONS_DROP_ADDRESS=${dropAddress}`);
  console.log(`ADMIN_ADDRESS=${creatorAddress}`);

  console.log("\n── Token identity (visible in LUKSO ecosystem) ─────────────");
  console.log(`Balloon Badge  → symbol: BALLOON  name: Balloon Badge`);
  console.log(`Balloon Card   → symbol: BALLOON  name: Balloon Card`);
  console.log(`Balloon Drop   → symbol: BALLOON  name: Balloon Drop`);
  console.log(`LSP4 Creator   → ${creatorAddress}`);
  console.log("─────────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
