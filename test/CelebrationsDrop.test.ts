import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {
  DropBadge,
  CelebrationsDrop,
  MockFollowRegistry,
  MockToken,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CelebrationsDrop + DropBadge", function () {
  let dropBadge: DropBadge;
  let drop: CelebrationsDrop;
  let followRegistry: MockFollowRegistry;
  let lsp7Token: MockToken;
  let lsp8Token: MockToken;

  let owner: SignerWithAddress;
  let host: SignerWithAddress;
  let claimer1: SignerWithAddress;
  let claimer2: SignerWithAddress;

  const META = ethers.toUtf8Bytes("ipfs://QmDropTest");
  const META_V2 = ethers.toUtf8Bytes("ipfs://QmDropTestV2");
  const LSP4_METADATA_KEY =
    "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";
  // force=true so plain EOA signers work in tests (production uses UPs with force=false)
  const FORCE = true;

  // Helper — build a minimal valid DropConfig for `host`
  async function baseConfig(overrides: Record<string, unknown> = {}) {
    const now = await time.latest();
    return {
      host: host.address,
      celebrationType: 0, // Birthday
      year: 2026,
      month: 4,
      day: 20,
      startAt: 0,        // immediate
      endAt: 0,          // no expiry
      maxSupply: 0,      // unlimited
      requireFollowsHost: false,
      minFollowers: 0,
      requiredLSP7: [] as string[],
      requiredLSP8: [] as string[],
      name: "Host Birthday Drop",
      imageIPFS: "QmImage",
      metadataBytes: META,
      ...overrides,
    };
  }

  beforeEach(async () => {
    [owner, host, claimer1, claimer2] = await ethers.getSigners();

    const FollowReg = await ethers.getContractFactory("MockFollowRegistry");
    followRegistry = await FollowReg.deploy();

    const Token = await ethers.getContractFactory("MockToken");
    lsp7Token = await Token.deploy();
    lsp8Token = await Token.deploy();

    const DropBadgeFactory = await ethers.getContractFactory("DropBadge");
    dropBadge = await DropBadgeFactory.deploy();

    const DropFactory = await ethers.getContractFactory("CelebrationsDrop");
    drop = await DropFactory.deploy(
      await dropBadge.getAddress(),
      await followRegistry.getAddress()
    );

    // Wire: only CelebrationsDrop can mint DropBadge tokens
    await dropBadge.setDropMinter(await drop.getAddress());
  });

  // ─── DropBadge direct tests ──────────────────────────────────────────────

  describe("DropBadge", () => {
    it("computes deterministic tokenId = keccak256(claimer, dropId)", async () => {
      const dropId = ethers.id("some-drop");
      const expected = ethers.keccak256(
        ethers.solidityPacked(["address", "bytes32"], [claimer1.address, dropId])
      );
      expect(await dropBadge.computeDropTokenId(claimer1.address, dropId)).to.equal(expected);
    });

    it("reverts mint from unauthorized caller", async () => {
      const dropId = ethers.id("fake");
      await expect(
        dropBadge.connect(claimer1).mintForDrop(claimer1.address, dropId, host.address, META, FORCE)
      ).to.be.revertedWith("DropBadge: unauthorized minter");
    });

    it("owner can update dropMinter", async () => {
      await dropBadge.setDropMinter(claimer1.address);
      expect(await dropBadge.dropMinter()).to.equal(claimer1.address);
    });

    it("records host as token creator for claimed badges", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );

      await drop.connect(claimer1).claim(dropId, FORCE);
      const tokenId = await dropBadge.computeDropTokenId(claimer1.address, dropId);

      expect(await dropBadge.dropHostOf(tokenId)).to.equal(host.address);
    });

    it("allows drop host to update claimed token metadata", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );

      await drop.connect(claimer1).claim(dropId, FORCE);
      const tokenId = await dropBadge.computeDropTokenId(claimer1.address, dropId);

      await dropBadge.connect(host).setTokenMetadataAsHost(tokenId, META_V2);

      expect(await dropBadge.getDataForTokenId(tokenId, LSP4_METADATA_KEY)).to.equal(
        ethers.hexlify(META_V2)
      );
    });

    it("reverts metadata update when caller is not the drop host", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );

      await drop.connect(claimer1).claim(dropId, FORCE);
      const tokenId = await dropBadge.computeDropTokenId(claimer1.address, dropId);

      await expect(
        dropBadge.connect(claimer1).setTokenMetadataAsHost(tokenId, META_V2)
      ).to.be.revertedWith("DropBadge: not drop host");
    });
  });

  // ─── createDrop ─────────────────────────────────────────────────────────

  describe("createDrop", () => {
    it("creates a drop and emits DropCreated", async () => {
      const cfg = await baseConfig();
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      await expect(drop.connect(host).createDrop(cfg))
        .to.emit(drop, "DropCreated")
        .withArgs(dropId, host.address, cfg.celebrationType, cfg.startAt, cfg.endAt, cfg.maxSupply);
    });

    it("stores the config correctly", async () => {
      const cfg = await baseConfig({ maxSupply: 100, requireFollowsHost: true });
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      const stored = await drop.getDrop(dropId);
      expect(stored.host).to.equal(host.address);
      expect(stored.maxSupply).to.equal(100);
      expect(stored.requireFollowsHost).to.be.true;
    });

    it("nonce increments — second drop has different id", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      await drop.connect(host).createDrop(cfg);
      const drops = await drop.getDropsByHost(host.address);
      expect(drops.length).to.equal(2);
      expect(drops[0]).to.not.equal(drops[1]);
    });

    it("reverts when host mismatch", async () => {
      const cfg = await baseConfig({ host: claimer1.address });
      await expect(drop.connect(host).createDrop(cfg)).to.be.revertedWith("CelebrationsDrop: host mismatch");
    });

    it("reverts on invalid month/day", async () => {
      await expect(drop.connect(host).createDrop(await baseConfig({ month: 13 })))
        .to.be.revertedWith("CelebrationsDrop: invalid month");
      await expect(drop.connect(host).createDrop(await baseConfig({ day: 0 })))
        .to.be.revertedWith("CelebrationsDrop: invalid day");
    });

    it("reverts when endAt <= startAt", async () => {
      const now = await time.latest();
      await expect(
        drop.connect(host).createDrop(await baseConfig({ startAt: now + 100, endAt: now + 50 }))
      ).to.be.revertedWith("CelebrationsDrop: endAt must be after startAt");
    });
  });

  // ─── claim — happy path ──────────────────────────────────────────────────

  describe("claim — happy path", () => {
    let dropId: string;

    beforeEach(async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
    });

    it("mints a DropBadge to the claimer and emits DropClaimed", async () => {
      const expectedTokenId = await dropBadge.computeDropTokenId(claimer1.address, dropId);
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.emit(drop, "DropClaimed")
        .withArgs(dropId, claimer1.address, expectedTokenId);
      expect(await dropBadge.balanceOf(claimer1.address)).to.equal(1);
    });

    it("increments claimedCount", async () => {
      await drop.connect(claimer1).claim(dropId, FORCE);
      await drop.connect(claimer2).claim(dropId, FORCE);
      expect(await drop.claimedCount(dropId)).to.equal(2);
    });

    it("records hasClaimed per address", async () => {
      await drop.connect(claimer1).claim(dropId, FORCE);
      expect(await drop.hasClaimed(dropId, claimer1.address)).to.be.true;
      expect(await drop.hasClaimed(dropId, claimer2.address)).to.be.false;
    });
  });

  // ─── claim — guard conditions ────────────────────────────────────────────

  describe("claim — guard conditions", () => {
    it("reverts on unknown dropId", async () => {
      const fakeId = ethers.id("nonexistent");
      await expect(drop.connect(claimer1).claim(fakeId, FORCE))
        .to.be.revertedWithCustomError(drop, "DropNotFound");
    });

    it("reverts before startAt window", async () => {
      const now = await time.latest();
      const cfg = await baseConfig({ startAt: now + 3600, endAt: now + 7200 });
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "DropNotActive");
    });

    it("reverts after endAt window", async () => {
      const now = await time.latest();
      const cfg = await baseConfig({ startAt: now - 200, endAt: now - 100 });
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "DropNotActive");
    });

    it("reverts when maxSupply is reached", async () => {
      const cfg = await baseConfig({ maxSupply: 1 });
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      await drop.connect(claimer1).claim(dropId, FORCE);
      await expect(drop.connect(claimer2).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "DropSoldOut");
    });

    it("reverts on double-claim by same address", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      await drop.connect(claimer1).claim(dropId, FORCE);
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "AlreadyClaimed");
    });
  });

  // ─── claim — social eligibility ─────────────────────────────────────────

  describe("claim — requireFollowsHost", () => {
    let dropId: string;

    beforeEach(async () => {
      const cfg = await baseConfig({ requireFollowsHost: true });
      await drop.connect(host).createDrop(cfg);
      dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
    });

    it("allows claim when claimer follows host", async () => {
      await followRegistry.setFollowing(claimer1.address, host.address, true);
      await expect(drop.connect(claimer1).claim(dropId, FORCE)).to.emit(drop, "DropClaimed");
    });

    it("reverts when claimer does not follow host", async () => {
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "EligibilityFailed")
        .withArgs("Must follow the host");
    });
  });

  describe("claim — minFollowers", () => {
    let dropId: string;

    beforeEach(async () => {
      const cfg = await baseConfig({ minFollowers: 10 });
      await drop.connect(host).createDrop(cfg);
      dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
    });

    it("allows claim when claimer has enough followers", async () => {
      await followRegistry.setFollowerCount(claimer1.address, 10);
      await expect(drop.connect(claimer1).claim(dropId, FORCE)).to.emit(drop, "DropClaimed");
    });

    it("reverts when claimer has insufficient followers", async () => {
      await followRegistry.setFollowerCount(claimer1.address, 9);
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "EligibilityFailed")
        .withArgs("Insufficient followers");
    });
  });

  describe("claim — requiredLSP7", () => {
    let dropId: string;

    beforeEach(async () => {
      const cfg = await baseConfig({ requiredLSP7: [await lsp7Token.getAddress()] });
      await drop.connect(host).createDrop(cfg);
      dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
    });

    it("allows claim when claimer holds the LSP7 token", async () => {
      await lsp7Token.setBalance(claimer1.address, 100);
      await expect(drop.connect(claimer1).claim(dropId, FORCE)).to.emit(drop, "DropClaimed");
    });

    it("reverts when claimer has no LSP7 balance", async () => {
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "EligibilityFailed")
        .withArgs("Missing required LSP7 token");
    });
  });

  describe("claim — requiredLSP8", () => {
    let dropId: string;

    beforeEach(async () => {
      const cfg = await baseConfig({ requiredLSP8: [await lsp8Token.getAddress()] });
      await drop.connect(host).createDrop(cfg);
      dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
    });

    it("allows claim when claimer holds the LSP8 collection token", async () => {
      await lsp8Token.setBalance(claimer1.address, 1);
      await expect(drop.connect(claimer1).claim(dropId, FORCE)).to.emit(drop, "DropClaimed");
    });

    it("reverts when claimer holds no LSP8 token", async () => {
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "EligibilityFailed")
        .withArgs("Missing required LSP8 token");
    });
  });

  // ─── cancelDrop ──────────────────────────────────────────────────────────

  describe("cancelDrop", () => {
    it("closes the window immediately so claims revert with DropNotActive", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      await drop.connect(host).cancelDrop(dropId);
      await expect(drop.connect(claimer1).claim(dropId, FORCE))
        .to.be.revertedWithCustomError(drop, "DropNotActive");
    });

    it("reverts when non-host tries to cancel", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      await expect(drop.connect(claimer1).cancelDrop(dropId))
        .to.be.revertedWithCustomError(drop, "UnauthorizedDropAction");
    });
  });

  // ─── checkEligibility (view) ─────────────────────────────────────────────

  describe("checkEligibility", () => {
    it("returns (true, '') when all conditions pass", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      const [ok, reason] = await drop.checkEligibility(dropId, claimer1.address);
      expect(ok).to.be.true;
      expect(reason).to.equal("");
    });

    it("returns (false, 'Drop not found') for unknown drop", async () => {
      const [ok, reason] = await drop.checkEligibility(ethers.id("x"), claimer1.address);
      expect(ok).to.be.false;
      expect(reason).to.equal("Drop not found");
    });

    it("returns (false, 'Already claimed') after claiming", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      const dropId = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [host.address, 0])
      );
      await drop.connect(claimer1).claim(dropId, FORCE);
      const [ok, reason] = await drop.checkEligibility(dropId, claimer1.address);
      expect(ok).to.be.false;
      expect(reason).to.equal("Already claimed");
    });
  });

  // ─── getDropsByHost ──────────────────────────────────────────────────────

  describe("getDropsByHost", () => {
    it("returns drops in most-recent-first order", async () => {
      const cfg = await baseConfig();
      await drop.connect(host).createDrop(cfg);
      await drop.connect(host).createDrop(cfg);
      await drop.connect(host).createDrop(cfg);
      const drops = await drop.getDropsByHost(host.address);
      expect(drops.length).to.equal(3);
      // Most recent nonce = 2
      expect(drops[0]).to.equal(
        ethers.keccak256(ethers.solidityPacked(["address", "uint256"], [host.address, 2]))
      );
    });
  });
});
