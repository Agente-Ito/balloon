import { expect } from "chai";
import { ethers } from "hardhat";
import { GreetingCard } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("GreetingCard", function () {
  let card: GreetingCard;
  let sender: SignerWithAddress;
  let receiver: SignerWithAddress;
  let other: SignerWithAddress;

  const CelebrationType = { Birthday: 0, UPAnniversary: 1, GlobalHoliday: 2, CustomEvent: 3 };
  const META = ethers.toUtf8Bytes("ipfs://QmGreetingTest");
  // force=true for tests (plain EOA recipients); use false in production (UP required)
  const FORCE = true;

  beforeEach(async () => {
    [, sender, receiver, other] = await ethers.getSigners();
    const Card = await ethers.getContractFactory("GreetingCard");
    card = await Card.deploy();
  });

  describe("Minting", () => {
    it("mints a card and emits GreetingCardSent", async () => {
      await expect(
        card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE)
      )
        .to.emit(card, "GreetingCardSent")
        .withArgs(
          sender.address,
          receiver.address,
          ethers.zeroPadValue("0x00", 32),
          CelebrationType.Birthday
        );

      expect(await card.nextTokenId()).to.equal(1);
    });

    it("assigns sequential tokenIds", async () => {
      await card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE);
      await card.connect(other).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE);
      expect(await card.nextTokenId()).to.equal(2);
    });

    it("reverts when sender tries to send to themselves", async () => {
      await expect(
        card.connect(sender).mintCard(sender.address, CelebrationType.Birthday, META, FORCE)
      ).to.be.revertedWith("GreetingCard: cannot send to yourself");
    });
  });

  describe("Rate limiting", () => {
    it("blocks a second card within 24 hours to the same recipient", async () => {
      await card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE);

      await expect(
        card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE)
      ).to.be.revertedWithCustomError(card, "GreetingRateLimited");
    });

    it("allows a card after the rate limit window elapses", async () => {
      await card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE);
      await time.increase(24 * 60 * 60 + 1);
      await expect(
        card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE)
      ).to.not.be.reverted;
    });

    it("allows the same sender to send cards to different recipients", async () => {
      await card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE);
      await expect(
        card.connect(sender).mintCard(other.address, CelebrationType.Birthday, META, FORCE)
      ).to.not.be.reverted;
    });

    it("allows different senders to send cards to the same recipient", async () => {
      await card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE);
      await expect(
        card.connect(other).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE)
      ).to.not.be.reverted;
    });
  });

  describe("cardsOf", () => {
    it("returns all tokenIds received by an address", async () => {
      await card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE);
      await card.connect(other).mintCard(receiver.address, CelebrationType.UPAnniversary, META, FORCE);

      const cards = await card.cardsOf(receiver.address);
      expect(cards.length).to.equal(2);
    });

    it("returns empty array for address with no cards", async () => {
      const cards = await card.cardsOf(other.address);
      expect(cards.length).to.equal(0);
    });
  });

  describe("nextAllowedAt", () => {
    it("returns future timestamp after first mint", async () => {
      const before = await time.latest();
      await card.connect(sender).mintCard(receiver.address, CelebrationType.Birthday, META, FORCE);
      const nextAt = await card.nextAllowedAt(sender.address, receiver.address);
      expect(nextAt).to.be.greaterThan(before);
    });
  });
});
