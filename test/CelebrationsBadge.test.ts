import { expect } from "chai";
import { ethers } from "hardhat";
import { CelebrationsBadge } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CelebrationsBadge", function () {
  let badge: CelebrationsBadge;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let delegate: SignerWithAddress;

  const CelebrationType = { Birthday: 0, UPAnniversary: 1, GlobalHoliday: 2, CustomEvent: 3 };
  const YEAR = 2026;
  const META = ethers.toUtf8Bytes("ipfs://QmTest");
  // force=true allows minting to plain EOAs (test environment); false in production (UP required)
  const FORCE = true;

  beforeEach(async () => {
    [owner, user1, user2, delegate] = await ethers.getSigners();
    const Badge = await ethers.getContractFactory("CelebrationsBadge");
    badge = await Badge.deploy(delegate.address);
  });

  describe("Minting", () => {
    it("allows user to mint their own badge", async () => {
      const tokenId = await badge.computeTokenId(user1.address, CelebrationType.Birthday, YEAR);
      await expect(
        badge.connect(user1).mintBadge(user1.address, CelebrationType.Birthday, YEAR, true, META, FORCE)
      )
        .to.emit(badge, "BadgeMinted")
        .withArgs(user1.address, tokenId, CelebrationType.Birthday, YEAR);
    });

    it("allows delegate to mint on behalf of user", async () => {
      await expect(
        badge.connect(delegate).mintBadge(user1.address, CelebrationType.Birthday, YEAR, false, META, FORCE)
      ).to.emit(badge, "BadgeMinted");
    });

    it("allows contract owner to mint for anyone", async () => {
      await badge.connect(owner).mintBadge(user2.address, CelebrationType.UPAnniversary, YEAR, false, META, FORCE);
      expect(await badge.badgeExists(user2.address, CelebrationType.UPAnniversary, YEAR)).to.be.true;
    });

    it("reverts when unauthorized caller tries to mint for another user", async () => {
      await expect(
        badge.connect(user2).mintBadge(user1.address, CelebrationType.Birthday, YEAR, true, META, FORCE)
      ).to.be.revertedWithCustomError(badge, "UnauthorizedMinter");
    });

    it("reverts on duplicate mint (same owner/type/year)", async () => {
      await badge.connect(user1).mintBadge(user1.address, CelebrationType.Birthday, YEAR, true, META, FORCE);
      await expect(
        badge.connect(user1).mintBadge(user1.address, CelebrationType.Birthday, YEAR, true, META, FORCE)
      ).to.be.revertedWithCustomError(badge, "BadgeAlreadyMinted");
    });

    it("allows minting different types in the same year", async () => {
      await badge.connect(user1).mintBadge(user1.address, CelebrationType.Birthday, YEAR, true, META, FORCE);
      await badge.connect(user1).mintBadge(user1.address, CelebrationType.UPAnniversary, YEAR, false, META, FORCE);
      expect(await badge.badgeExists(user1.address, CelebrationType.Birthday, YEAR)).to.be.true;
      expect(await badge.badgeExists(user1.address, CelebrationType.UPAnniversary, YEAR)).to.be.true;
    });
  });

  describe("Soulbound enforcement", () => {
    it("blocks transfer of soulbound badge", async () => {
      await badge.connect(user1).mintBadge(user1.address, CelebrationType.Birthday, YEAR, true, META, FORCE);
      const tokenId = await badge.computeTokenId(user1.address, CelebrationType.Birthday, YEAR);

      await expect(
        badge.connect(user1).transfer(user1.address, user2.address, tokenId, true, "0x")
      ).to.be.revertedWithCustomError(badge, "BadgeSoulbound");
    });

    it("allows transfer of non-soulbound badge", async () => {
      await badge.connect(owner).mintBadge(user1.address, CelebrationType.CustomEvent, YEAR, false, META, FORCE);
      const tokenId = await badge.computeTokenId(user1.address, CelebrationType.CustomEvent, YEAR);
      await expect(
        badge.connect(user1).transfer(user1.address, user2.address, tokenId, true, "0x")
      ).to.not.be.reverted;
    });
  });

  describe("computeTokenId", () => {
    it("produces different tokenIds for different owners", async () => {
      const t1 = await badge.computeTokenId(user1.address, CelebrationType.Birthday, YEAR);
      const t2 = await badge.computeTokenId(user2.address, CelebrationType.Birthday, YEAR);
      expect(t1).to.not.equal(t2);
    });

    it("produces different tokenIds for different years", async () => {
      const t1 = await badge.computeTokenId(user1.address, CelebrationType.Birthday, 2025);
      const t2 = await badge.computeTokenId(user1.address, CelebrationType.Birthday, 2026);
      expect(t1).to.not.equal(t2);
    });

    it("produces different tokenIds for different types", async () => {
      const t1 = await badge.computeTokenId(user1.address, CelebrationType.Birthday, YEAR);
      const t2 = await badge.computeTokenId(user1.address, CelebrationType.UPAnniversary, YEAR);
      expect(t1).to.not.equal(t2);
    });
  });

  describe("Delegate management", () => {
    it("owner can update delegate", async () => {
      await badge.connect(owner).setDelegate(user2.address);
      expect(await badge.delegate()).to.equal(user2.address);
    });

    it("non-owner cannot update delegate", async () => {
      await expect(badge.connect(user1).setDelegate(user2.address)).to.be.reverted;
    });
  });
});
