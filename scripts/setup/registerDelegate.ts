/**
 * Register CelebrationsDelegate on a Universal Profile as its LSP1 URD.
 * Moved from scripts/registerDelegate.ts.
 *
 * Usage: npx hardhat run scripts/setup/registerDelegate.ts --network luksoTestnet
 */
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const LSP1_URD_KEY = "0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbad1f2a2b6eb54ee6ec93af21b19af";

async function main() {
  const [deployer] = await ethers.getSigners();
  const delegateAddress = process.env.VITE_CELEBRATIONS_DELEGATE_ADDRESS;
  const upAddress = process.env.UP_ADDRESS;

  if (!delegateAddress || !upAddress) {
    throw new Error("Set VITE_CELEBRATIONS_DELEGATE_ADDRESS and UP_ADDRESS in .env");
  }

  console.log("Registering delegate:", delegateAddress, "on UP:", upAddress);

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

  if (owner.toLowerCase() === deployer.address.toLowerCase()) {
    const tx = await up.setData(LSP1_URD_KEY, delegateAddress);
    await tx.wait();
  } else {
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

main().catch((err) => { console.error(err); process.exit(1); });
