import { ethers } from "hardhat";

async function main() {
  const [owner, up, user] = await ethers.getSigners();
  const Badge = await (await ethers.getContractFactory("CelebrationsBadge")).deploy("0x0000000000000000000000000000000000000000");
  const Delegate = await (await ethers.getContractFactory("CelebrationsDelegate")).deploy(await Badge.getAddress());
  
  try {
    const tx = await Delegate.connect(up).universalReceiverDelegate(
      user.address, 0,
      "0x20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c",
      "0x"
    );
    await tx.wait();
    console.log("Success");
  } catch (e: any) {
    console.log("Error:", e.message?.slice(0, 400));
  }
}
main().catch(console.error);
