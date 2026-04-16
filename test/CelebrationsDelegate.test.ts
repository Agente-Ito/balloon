import { expect } from "chai";
import { ethers } from "hardhat";
import { CelebrationsBadge, CelebrationsDelegate } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Mock Universal Profile that implements ERC725Y getData
const MOCK_UP_ABI = [
  "function getData(bytes32 dataKey) external view returns (bytes memory)",
  "function setData(bytes32 dataKey, bytes calldata dataValue) external",
];

describe("CelebrationsDelegate", function () {
  let badge: CelebrationsBadge;
  let delegate: CelebrationsDelegate;
  let owner: SignerWithAddress;
  let up: SignerWithAddress; // simulates the Universal Profile (msg.sender in delegate)
  let user: SignerWithAddress;

  // Well-known typeIds
  const LSP7_RECIPIENT_TYPEID =
    "0x429ac7a06903dbc9c13dfcb3c9d11df8194581fa047c96d7a4171fc7402958ea";
  const LSP8_RECIPIENT_TYPEID =
    "0x20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c";

  beforeEach(async () => {
    [owner, up, user] = await ethers.getSigners();

    const Badge = await ethers.getContractFactory("CelebrationsBadge");
    badge = await Badge.deploy("0x0000000000000000000000000000000000000000");

    const Delegate = await ethers.getContractFactory("CelebrationsDelegate");
    delegate = await Delegate.deploy(await badge.getAddress());

    // Wire delegate into badge
    await badge.setDelegate(await delegate.getAddress());
    // Allow delegate to mint badges to EOAs in tests (force=true bypasses LSP1 check)

  });

  describe("supportsInterface", () => {
    it("returns true for LSP1 delegate interface", async () => {
      expect(await delegate.supportsInterface("0xa245bbda")).to.be.true;
    });

    it("returns true for ERC165 interface", async () => {
      expect(await delegate.supportsInterface("0x01ffc9a7")).to.be.true;
    });
  });

  describe("universalReceiverDelegate", () => {
    it("handles LSP8 token reception without reverting", async () => {
      // up simulates being a Universal Profile calling the delegate
      await expect(
        delegate.connect(up).universalReceiverDelegate(
          user.address,       // notifier (token contract)
          0,                  // value
          LSP8_RECIPIENT_TYPEID,
          "0x"
        )
      ).to.not.be.reverted;
    });

    it("handles LSP7 token reception without reverting", async () => {
      // Encode minimal LSP7 notification data
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "address", "uint256"],
        [user.address, user.address, up.address, ethers.parseEther("1")]
      );

      await expect(
        delegate.connect(up).universalReceiverDelegate(
          user.address,
          0,
          LSP7_RECIPIENT_TYPEID,
          data
        )
      ).to.not.be.reverted;
    });

    it("handles unknown typeId without reverting", async () => {
      await expect(
        delegate.connect(up).universalReceiverDelegate(
          user.address,
          0,
          ethers.keccak256(ethers.toUtf8Bytes("unknown")),
          "0x"
        )
      ).to.not.be.reverted;
    });
  });
});
