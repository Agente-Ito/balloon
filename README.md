# Celebrations — LUKSO Social Celebration dApp

A decentralized social calendar built on LUKSO. Celebrations lets Universal Profile users mark special dates, send on-chain greeting cards, mint commemorative badges, and run social badge-drop campaigns — all from inside the LUKSO Grid.

---

## What you can do

### 1. Track your celebration dates
Store personal dates directly on your Universal Profile (ERC725Y on-chain storage):

- **Birthday** — month/day, with optional year. Stored as `YYYY-MM-DD` or `--MM-DD`.
- **Custom events** — anniversaries, graduations, launches, or any recurring/one-time date.
- **UP Anniversary** — automatically computed from the `profileCreatedAt` timestamp on your UP.
- **Global holidays** — pre-loaded in the `CelebrationRegistry` contract (Christmas, New Year, Valentine's Day, Halloween, and more).

---

### 2. Auto-mint birthday & anniversary badges (LSP1 Delegate)

By registering `CelebrationsDelegate` as your Universal Profile's LSP1 receiver delegate, the system automatically detects celebration dates whenever your UP receives a token:

- Reads your birthday from ERC725Y (`app:celebrations:birthday` key).
- Reads your UP creation date from ERC725Y (`app:celebrations:profileCreatedAt`).
- If today matches, and no badge has been minted yet this year, it auto-mints a **soulbound** LSP8 badge to your profile.
- Emits `BirthdayDetected` or `UPAnniversaryDetected` events (indexer picks these up).
- Detection is safe: works whether the triggering token is LSP7 or LSP8, and never reverts your UP if the badge contract is unavailable.

> Auto-minting is opt-in via delegate registration. You can skip it and mint manually at any time.

---

### 3. Mint commemorative badges (`CelebrationsBadge`)

Anyone can mint a **CelebrationsBadge** LSP8 NFT for a celebration:

- **TokenId** is deterministic: `keccak256(owner, celebrationType, year)` — one badge per person per celebration type per year.
- **Soulbound option** — badge can be locked to the recipient and made non-transferable.
- **Celebration types:** Birthday (0), UP Anniversary (1), Global Holiday (2), Custom Event (3).
- Prevents duplicate minting for the same owner/type/year combination.
- LSP4 metadata (image, name, description) stored on IPFS via Pinata.

```
CelebrationsBadge.mintBadge(
  address to,
  CelebrationType celebrationType,
  uint16 year,
  bool soulbound,
  bytes metadataBytes,
  bool force
) → bytes32 tokenId
```

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

### 5. Create social badge-drop campaigns (`CelebrationsDrop` + `DropBadge`)

Run a public badge-drop campaign tied to a celebration date. Anyone can claim if they meet your eligibility conditions.

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
| `imageIPFS` | IPFS CID of the badge artwork |

**Claim a drop:**

```
CelebrationsDrop.claim(bytes32 dropId, bool force)
```

- Checks all eligibility gates (follow, followers, token holdings).
- Mints a `DropBadge` LSP8 NFT to the claimer.
- Drop badge TokenId = `keccak256(claimer, dropId)` — one per person per drop.
- `checkEligibility(dropId, claimer)` — safe off-chain check that returns a reason on failure.

**Host controls:**
- `cancelDrop(bytes32 dropId)` — immediately closes the drop (sets `endAt = now`).
- `getDropsByHost(address host)` — list all drops created by an address.
- `hasClaimed(dropId, claimer)` — check if an address already claimed.
- Drop host can update metadata of any claimed `DropBadge` token that came from their drop (on-chain, even outside the dApp).
- Each claimed drop token stores the original drop creator (host), so indexers/UIs can display who created it.

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
- Curator can reopen submissions for a new cycle.

This is currently managed via the indexer REST API — the winning artwork can then become the image for a `CelebrationsDrop`.

---

### 8. Wishlist (ERC725Y off-chain storage)

Store a wishlist of desired assets directly on your Universal Profile:

- Items can be: **LSP8 NFT**, **LSP7 token**, or a free-text **Note**.
- Optional fields: contract address, token ID (for specific LSP8 tokens), description.
- Wishlist is visible to followers who visit your profile in the Celebrations Grid app.
- Controlled by the `wishlistVisible` setting in your profile settings.

---

## Contract overview

| Contract | Standard | Purpose |
|---|---|---|
| `CelebrationsBadge` | LSP8 | Commemorative badge NFTs. One per person/type/year. Optional soulbound. |
| `GreetingCard` | LSP8 | Greeting card NFTs. Sequential IDs. 24-hour rate limit per pair. |
| `CelebrationsDelegate` | LSP1 URD | Auto-detects birthdays/anniversaries on token receive. Auto-mints badges. |
| `CelebrationsDrop` | Ownable | Social drop campaigns with eligibility gates (follow, tokens, followers). |
| `DropBadge` | LSP8 | Badge NFTs minted through drop claims. One per claimer per drop. |
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
| `BadgeMinted(recipient, tokenId, celebrationType, year)` | CelebrationsBadge | Badge minted (manual or auto) |
| `GreetingCardSent(from, to, tokenId, celebrationType)` | GreetingCard | Greeting card sent |
| `BirthdayDetected(profile, year)` | CelebrationsDelegate | Birthday match detected on token receive |
| `UPAnniversaryDetected(profile, year, yearsOld)` | CelebrationsDelegate | Anniversary match detected |
| `CelebrationGiftReceived(profile, sender, asset, celebrationType)` | CelebrationsDelegate | LSP7/LSP8 gift received on a celebration day |
| `DropCreated(dropId, host, celebrationType, startAt, endAt, maxSupply)` | CelebrationsDrop | New drop campaign created |
| `DropClaimed(dropId, claimer, tokenId)` | CelebrationsDrop | Drop badge claimed |

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

## Indexer REST API

The indexer (`indexer/`) listens for on-chain events and exposes a REST API for the frontend.

| Endpoint | Description |
|---|---|
| `GET /badges?owner=0x...` | Badges owned by an address |
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
| `BalloonLogo` | Shows `balloon-wordmark.jpeg` asset; SVG fallback with violet palette |
| `BalloonIcon` | SVG balloon mark. `foil` prop enables radial gradient metallic look |
| `BalloonName` | Renders a name as metallic balloon letters using the `balloon-alphabet.jpeg` sprite sheet |
| `BalloonBurst` | Full-screen celebration overlay — rising balloons + confetti |

#### BalloonName usage

```tsx
import { BalloonName } from "@/components/BalloonName";

// Displays "MARIA" as purple foil balloon letters
<BalloonName name="MARIA" letterHeight={56} />
```

Supports A–Z (uppercase/lowercase). Spaces render as gaps. Useful as a decorative detail on celebration cards or badge headers.

### Assets (`frontend/public/`)

| File | Use |
|---|---|
| `balloon-wordmark.jpeg` | "BALLOON" foil word logo — used by `BalloonLogo` |
| `balloon-b.jpeg` | Single "B" balloon — OG image for social previews |
| `balloon-alphabet.jpeg` | A–Z foil letter sprite sheet — used by `BalloonName` |
| `favicon.svg` | SVG balloon favicon (shown in browser tabs and block explorer tx pages) |

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
npm run deploy:all
# Copy printed addresses into .env as VITE_* vars

# 4. Register the LSP1 delegate on your Universal Profile
UP_ADDRESS=0x... npm run register-delegate

# 5. Start the indexer
npm run indexer:dev

# 6. Start the frontend
npm run frontend:dev
```

---

## Known limitations

- The `CelebrationsDelegate` auto-mint only triggers when the UP **receives** a token. If no token is received on a birthday, the badge is not automatically minted — the user can mint manually from the Celebrations app.
- Custom events and wishlist items are stored on IPFS; the indexer does not track them (they are read directly from the UP's ERC725Y).
- The community series voting system is currently off-chain (indexer-only). Votes are not recorded on-chain.
- Drop eligibility gates are stacked with AND logic — all conditions must be met simultaneously.
- Drop badge artwork (`imageIPFS`) must be uploaded to IPFS before creating the drop.
