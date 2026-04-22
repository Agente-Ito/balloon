# Celebrations — LUKSO Social Celebration dApp

A decentralized social calendar built on LUKSO. Celebrations lets Universal Profile users mark special dates, send on-chain greeting cards, earn passport stamps from drop campaigns, and run social badge-drop campaigns — all from inside the LUKSO Grid.

---

## What you can do

### 1. Track your celebration dates
Store personal dates directly on your Universal Profile (ERC725Y on-chain storage):

- **Birthday** — month/day, with optional year. Stored as `YYYY-MM-DD` or `--MM-DD`.
- **Custom events** — anniversaries, graduations, launches, or any recurring/one-time date.
- **UP Anniversary** — automatically computed from the `profileCreatedAt` timestamp on your UP.
- **Global holidays** — pre-loaded in the `CelebrationRegistry` contract (Christmas, New Year, Valentine's Day, Halloween, and more).

---

### 2. Celebration Passport (`CelebrationPassport`)

Instead of minting a new NFT for every celebration, every user has a single **soulbound passport** that accumulates stamps over time. This keeps Universal Profiles clean regardless of participation count.

- **One token per user** — `tokenId = keccak256(owner)`, deterministic and unique.
- **Always soulbound** — the passport cannot be transferred.
- **Auto-minted** on the first stamp received (no separate mint step needed).
- **Stamps stored fully on-chain** — readable without an indexer via `getStamps(owner)`.

Each stamp records:

| Field | Type | Description |
|---|---|---|
| `celebrationType` | `uint8` | Birthday (0), UP Anniversary (1), Global Holiday (2), Custom Event (3) |
| `year` | `uint16` | Calendar year |
| `month` | `uint8` | Calendar month (0 = unknown, set by delegate stamps) |
| `day` | `uint8` | Calendar day (0 = unknown) |
| `dropId` | `bytes32` | Source drop; `bytes32(0)` for personal/auto stamps |
| `timestamp` | `uint64` | Block timestamp when the stamp was added |

**Key functions:**

```
CelebrationPassport.addStamp(address to, StampRecord stamp) → bytes32 tokenId
CelebrationPassport.getStamps(address owner) → StampRecord[]
CelebrationPassport.hasPassport(address owner) → bool
CelebrationPassport.stampCount(address owner) → uint256
CelebrationPassport.computeTokenId(address owner) → bytes32
```

Only authorized callers can add stamps (`CelebrationsDrop`, `CelebrationsDelegate`, contract owner).

---

### 3. Auto-stamp on birthday & anniversary (LSP1 Delegate)

By registering `CelebrationsDelegate` as your Universal Profile's LSP1 receiver delegate, the system automatically detects celebration dates whenever your UP receives a token:

- Reads your birthday from ERC725Y (`app:celebrations:birthday` key).
- Reads your UP creation date from ERC725Y (`app:celebrations:profileCreatedAt`).
- If today matches, and no stamp has been added yet this year, it auto-adds a stamp to your passport.
- Emits `BirthdayDetected` or `UPAnniversaryDetected` events (indexer picks these up).
- Detection is safe: never reverts your UP if the passport contract is unavailable.

> Auto-stamping is opt-in via delegate registration.

---

### 4. Send greeting cards (`GreetingCard`)

Send a personalized on-chain greeting card as an LSP8 NFT:

- Sequential token IDs (each card is unique).
- **Rate limit:** maximum 1 card per sender → recipient pair per 24 hours.
- Sender cannot send a card to themselves.
- LSP4 metadata includes: message, celebration type, template art, and sender info.
- `nextAllowedAt(sender, recipient)` — off-chain check for when the next card can be sent.

```
GreetingCard.mintCard(
  address to,
  CelebrationType celebrationType,
  bytes metadataBytes,
  bool force
) → bytes32 tokenId
```

---

### 5. Create social badge-drop campaigns (`CelebrationsDrop`)

Run a public drop campaign tied to a celebration date. Eligible claimers receive a stamp on their passport instead of a new NFT token.

**Create a drop:**

```
CelebrationsDrop.createDrop(DropConfig config) → bytes32 dropId
```

**Drop configuration options:**

| Field | Description |
|---|---|
| `celebrationType` | Birthday, UP Anniversary, Holiday, or Custom |
| `year / month / day` | The celebration date. Year = 0 means any year. |
| `startAt / endAt` | Optional time window (0 = open-ended) |
| `maxSupply` | Cap on total claims (0 = unlimited) |
| `requireFollowsHost` | Claimer must follow the drop host |
| `minFollowers` | Claimer must have at least N followers |
| `requiredLSP7[]` | Claimer must hold balance of each listed LSP7 token (max 5) |
| `requiredLSP8[]` | Claimer must hold a token from each listed LSP8 collection (max 5) |
| `name` | Display name of the drop |
| `imageIPFS` | IPFS CID of the drop artwork |

**Claim a drop:**

```
CelebrationsDrop.claim(bytes32 dropId, bool force)
```

- Checks all eligibility gates (follow, followers, token holdings).
- Calls `CelebrationPassport.addStamp()` — no new NFT is minted to the claimer's wallet.
- `checkEligibility(dropId, claimer)` — safe off-chain check that returns a reason on failure.

**Host controls:**
- `cancelDrop(bytes32 dropId)` — immediately closes the drop.
- `getDropsByHost(address host)` — list all drops created by an address.
- `hasClaimed(dropId, claimer)` — check if an address already claimed.

---

### 6. Social calendar

The indexer builds a real-time social graph from LSP26 follow events and celebration data:

- **`GET /social-calendar?viewer=0x...&month=4`** returns birthdays and active drops from all profiles the viewer follows.
- Respects privacy settings stored on each UP (`app:celebrations:settings`).
- Lets you see upcoming celebrations from your network directly in the Calendar view.

---

### 7. Community badge series & voting (Indexer + SeriesView)

Curators can run community artwork voting for celebration themes:

- A **curator** creates a series for a specific celebration date.
- **Artists** submit badge artwork (IPFS image + optional statement).
- **Community** votes on submissions (off-chain, stored in indexer).
- Curator **selects a winner** and can link it to a drop campaign.

This is managed via the indexer REST API — the winning artwork becomes the image for a `CelebrationsDrop`.

---

### 8. Wishlist (ERC725Y off-chain storage)

Store a wishlist of desired assets directly on your Universal Profile:

- Items can be: **LSP8 NFT**, **LSP7 token**, or a free-text **Note**.
- Optional fields: contract address, token ID (for specific LSP8 tokens), description.
- Visible to followers who visit your profile in the Grid app.
- Controlled by the `wishlistVisible` setting in your profile settings.

---

## Contract overview

| Contract | Standard | Purpose |
|---|---|---|
| `CelebrationPassport` | LSP8 (soulbound) | One passport per user. Accumulates stamps instead of minting new tokens per celebration. |
| `GreetingCard` | LSP8 | Greeting card NFTs. Sequential IDs. 24-hour rate limit per pair. |
| `CelebrationsDelegate` | LSP1 URD | Auto-detects birthdays/anniversaries on token receive. Adds stamps to passport. |
| `CelebrationsDrop` | Ownable | Social drop campaigns with eligibility gates. Claims add stamps to passport. |
| `CelebrationRegistry` | Ownable | Registry of global holidays/festivities. Owner-managed. |
| `FollowRegistry` | — | Wrapper around LSP26 for follower/following queries. |

---

## Celebration types

| Value | Name | Description |
|---|---|---|
| `0` | Birthday | Personal birthday |
| `1` | UP Anniversary | Years since Universal Profile creation |
| `2` | Global Holiday | Holidays from the CelebrationRegistry |
| `3` | Custom Event | Any user-defined recurring or one-time event |

---

## Events emitted

| Event | Contract | When |
|---|---|---|
| `StampAdded(tokenId, owner, celebrationType, year, month, day, dropId, timestamp)` | CelebrationPassport | A stamp is added to a passport |
| `GreetingCardSent(from, to, tokenId, celebrationType)` | GreetingCard | Greeting card sent |
| `BirthdayDetected(profile, year)` | CelebrationsDelegate | Birthday match detected on token receive |
| `UPAnniversaryDetected(profile, year, yearsOld)` | CelebrationsDelegate | Anniversary match detected |
| `CelebrationGiftReceived(profile, sender, asset, celebrationType)` | CelebrationsDelegate | LSP7/LSP8 gift received on a celebration day |
| `DropCreated(dropId, host, celebrationType, startAt, endAt, maxSupply)` | CelebrationsDrop | New drop campaign created |
| `DropClaimed(dropId, claimer, tokenId)` | CelebrationsDrop | Drop claimed — stamp added to claimer's passport |

---

## ERC725Y keys (stored on Universal Profile)

| Key name | Format | Description |
|---|---|---|
| `app:celebrations:birthday` | `YYYY-MM-DD` or `--MM-DD` (bytes10) | User's birthday. Year optional. |
| `app:celebrations:profileCreatedAt` | uint256 (unix timestamp) | UP creation date — source of anniversary calculation |
| `app:celebrations:events[]` | LSP2 array of IPFS JSONURL | Custom events (anniversaries, graduations, etc.) |
| `app:celebrations:wishlist[]` | LSP2 array of IPFS JSONURL | Wishlist items (NFTs, tokens, notes) |
| `app:celebrations:settings` | IPFS JSONURL | Profile privacy & notification settings |

---

## Testnet contract addresses (Chain ID 4201)

| Contract | Address |
|---|---|
| `CelebrationPassport` | `0xC1Aa1ACe36C73c40a9f03C0B08c1d506A35920F5` |
| `CelebrationsDelegate` | `0x6AA8B294bB18Bc87CA4925c8bE8273D431F4B5AE` |
| `CelebrationsDrop` | `0xD268fD3a966171A610FeF06a0cC582770A730b94` |
| `GreetingCard` | `0x6e941f2Dd56286F8c8839985DCfc6D279f6a2Cc5` |
| `CelebrationRegistry` | `0xbE5c5441b18D3455E2958ffa0C475ba7D509f7C2` |
| `FollowRegistry` | `0x3B512E1522a37f99C2d8820D1Ab73EeF8305483B` |

---

## Indexer REST API

The indexer (`indexer/`) listens for on-chain events and exposes a REST API for the frontend.

| Endpoint | Description |
|---|---|
| `GET /badges?owner=0x...` | Stamps on a passport (via `StampAdded` events) |
| `GET /cards?recipient=0x...` | Greeting cards received |
| `GET /cards?sender=0x...` | Greeting cards sent |
| `GET /drops?host=0x...` | Drops created by host |
| `GET /drops?active=true` | All currently active drops |
| `GET /drops?month=4&day=20` | Drops for a specific calendar date |
| `GET /drops/:dropId` | Full drop configuration |
| `GET /drops/:dropId/claims` | List of claimers |
| `GET /followers/:address` | Current followers |
| `GET /following/:address` | Profiles this address follows |
| `GET /social-calendar?viewer=0x...&month=4` | Social calendar for a viewer |
| `GET /series` | Community series list |
| `POST /series/:id/vote` | Cast/change vote on a series submission |
| `GET /status` | Indexer listener health |

---

## Design system

The frontend uses a light-mode balloon-foil aesthetic — warm cream backgrounds, metallic violet buttons, and subtle shimmer effects.

### Color palette

| Token | Hex | Use |
|---|---|---|
| `cel-violet` | `#6A1B9A` | Primary — buttons, links, active states |
| `cel-accent` | `#9C4EDB` | Highlight, gradients, hover glow |
| `cel-cream` | `#F5F0E1` | Main background |
| `cel-beige` | `#E8D9C8` | Borders, dividers, secondary surfaces |
| `cel-text` | `#2C2C2C` | Body text |
| `cel-muted` | `#8B7D7D` | Secondary text, placeholders |
| `cel-card` | `#FFFFFF` | Card surface |

### Button classes

| Class | Description |
|---|---|
| `.btn-primary` | Metallic foil gradient violet, white text, shimmer sweep on hover |
| `.btn-secondary` | Outlined violet border, transparent fill |
| `.btn-celebrate` | Animated foil gradient — use for the main celebration CTA |
| `.btn-ghost` | Muted text, subtle violet hover |

### Utility classes

- `.card` — white card with beige border and soft violet drop shadow
- `.input` — cream background, beige border, violet focus ring
- `.foil-shimmer` — adds a light sweep animation to any element (metallic foil effect)
- `.violet-header` — foil-gradient header for card/panel tops, white text

### Components

| Component | Description |
|---|---|
| `BalloonLogo` | Renders `balloon-logo.png` (RGBA, transparent background) with a gentle float animation |
| `BalloonIcon` | Renders `balloon-b.png` — a purple foil "B" balloon. `color` prop applies hue rotation for tinting |
| `BalloonName` | Renders a name as metallic balloon letters using the `balloon-alphabet.jpeg` sprite sheet |
| `BalloonBurst` | Full-screen celebration overlay — rising balloons + confetti |

#### BalloonName usage

```tsx
import { BalloonName } from "@/components/BalloonName";

// Displays "MARIA" as purple foil balloon letters
<BalloonName name="MARIA" letterHeight={56} />
```

Supports A–Z (uppercase/lowercase). Spaces render as gaps.

### Assets (`frontend/public/`)

| File | Use |
|---|---|
| `balloon-logo.png` | "BALLOON" foil wordmark — RGBA PNG, used by `BalloonLogo` |
| `balloon-b.png` | Single "B" balloon — RGBA PNG, used by `BalloonIcon` |
| `balloon-alphabet.jpeg` | A–Z foil letter sprite sheet — used by `BalloonName` |
| `favicon.svg` | SVG balloon favicon |

---

## Tech stack

| Layer | Technologies |
|---|---|
| Contracts | Solidity ^0.8.17, Hardhat, `@lukso/lsp8-contracts@0.15.0`, `@erc725/smart-contracts@^7.0.0` |
| Frontend | React 18, Vite, TypeScript, TanStack Query, Zustand, Viem, `@lukso/up-provider`, Tailwind CSS |
| Indexer | Node.js, Express, SQLite (WAL mode), Viem |
| Storage | IPFS via Pinata (JWT auth) for NFT metadata and images |
| Network | LUKSO Mainnet / Testnet (Chain ID 42 / 4201) |

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in: PRIVATE_KEY, PINATA_JWT, RPC_URL

# 3. Deploy contracts
npx hardhat ignition deploy ignition/modules/Celebrations.ts \
  --network luksoTestnet \
  --parameters ignition/parameters/luksoTestnet.json

# Copy printed addresses into .env as VITE_* vars

# 4. Register the LSP1 delegate on your Universal Profile
npx hardhat run scripts/registerDelegate.ts --network luksoTestnet

# 5. Start the indexer
npm run indexer:dev

# 6. Start the frontend
npm run frontend:dev
```

---

## Known limitations

- The `CelebrationsDelegate` auto-stamp only triggers when the UP **receives** a token. If no token is received on a birthday, no stamp is added automatically — but drops and manual flows still work.
- Custom events and wishlist items are stored on IPFS; the indexer does not track them (they are read directly from the UP's ERC725Y).
- The community series voting system is currently off-chain (indexer-only). Votes are not recorded on-chain.
- Drop eligibility gates are stacked with AND logic — all conditions must be met simultaneously.
- Drop artwork (`imageIPFS`) must be uploaded to IPFS before creating the drop.
- Stamps from the delegate have `month=0` and `day=0` — the actual birthday date is on the UP's ERC725Y, not repeated in the stamp.
