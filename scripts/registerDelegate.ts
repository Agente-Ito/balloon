/**
 * Register CelebrationsDelegate on a Universal Profile as its LSP1 URD.
 *
 * The UP's Key Manager (LSP6) must grant the deployer address SETDATA permission
 * before this script can run. On LUKSO Testnet you can do this via universalprofile.cloud.
 *
 * LSP1 URD key: keccak256("LSP1UniversalReceiverDelegate")
 * Source: @lukso/lsp1-contracts LSP1Constants.sol
 *
 * Usage: npx hardhat run scripts/registerDelegate.ts --network luksoTestnet
 */
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

// Well-known key for LSP1 URD registration on a Universal Profile
const LSP1_URD_KEY = "0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbad1f2a2b6eb54ee6ec93af21b19af";

async function main() {
  const [deployer] = await ethers.getSigners();
  const delegateAddress = process.env.VITE_CELEBRATIONS_DELEGATE_ADDRESS;
  const upAddress = process.env.UP_ADDRESS; // your Universal Profile address

  if (!delegateAddress || !upAddress) {
    throw new Error("Set VITE_CELEBRATIONS_DELEGATE_ADDRESS and UP_ADDRESS in .env");
  }

  console.log("Registering delegate:", delegateAddress);
  console.log("On Universal Profile:", upAddress);

  // The UP contract exposes setData(bytes32 key, bytes value)
  // We must call this through the Key Manager if the UP has one.
  const up = new ethers.Contract(
    upAddress,
    [
      "function setData(bytes32 dataKey, bytes calldata dataValue) external payable",
      "function owner() external view returns (address)",
    ],
    deployer
  );

  const owner = await up.owner();
  console.log("UP owner (Key Manager):", owner);

  // If the UP is controlled by a Key Manager, call through it.
  // Otherwise call directly if deployer IS the UP owner.
  if (owner.toLowerCase() === deployer.address.toLowerCase()) {
    // Deployer directly owns the UP (no Key Manager layer)
    const tx = await up.setData(LSP1_URD_KEY, delegateAddress);
    await tx.wait();
  } else {
    // Call through the Key Manager
    const keyManager = new ethers.Contract(
      owner,
      ["function execute(bytes calldata payload) external payable returns (bytes memory)"],
      deployer
    );

    const iface = new ethers.Interface([
      "function setData(bytes32 dataKey, bytes calldata dataValue) external payable",
    ]);
    const calldata = iface.encodeFunctionData("setData", [LSP1_URD_KEY, delegateAddress]);

    const tx = await keyManager.execute(calldata);
    await tx.wait();
  }

  console.log("LSP1 delegate registered successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
