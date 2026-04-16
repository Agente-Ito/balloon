// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title ICelebrationTypes
/// @notice Shared enum, events, and errors for the Celebrations dApp on LUKSO
interface ICelebrationTypes {
    // ─────────────────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Supported celebration types
    enum CelebrationType {
        Birthday,       // 0 — personal birthday
        UPAnniversary,  // 1 — Universal Profile creation anniversary
        GlobalHoliday,  // 2 — Christmas, New Year, etc.
        CustomEvent     // 3 — user-defined recurring or one-time event
    }

    // ─────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Emitted when a commemorative badge NFT is minted
    event BadgeMinted(
        address indexed recipient,
        bytes32 indexed tokenId,
        CelebrationType celebrationType,
        uint16 year
    );

    /// @notice Emitted when a greeting card NFT is minted and sent
    event GreetingCardSent(
        address indexed from,
        address indexed to,
        bytes32 indexed tokenId,
        CelebrationType celebrationType
    );

    /// @notice Emitted by the LSP1 delegate when a birthday is detected on-chain
    event BirthdayDetected(address indexed profile, uint16 year);

    /// @notice Emitted by the LSP1 delegate when a UP anniversary is detected
    event UPAnniversaryDetected(address indexed profile, uint16 year, uint256 yearsOld);

    /// @notice Emitted by the LSP1 delegate when a gift asset is received during a celebration
    event CelebrationGiftReceived(
        address indexed profile,
        address indexed sender,
        address asset,
        CelebrationType celebrationType
    );

    // ─────────────────────────────────────────────────────────────────────
    // Drop structs
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Configuration for a badge drop campaign
    /// @dev Dynamic arrays (requiredLSP7/LSP8) are kept short in practice (≤5 each)
    struct DropConfig {
        // Identity
        address host;               // creator of the drop
        uint8 celebrationType;      // 0=Birthday,1=UPAnniversary,2=GlobalHoliday,3=CustomEvent
        uint16 year;                // 0 = applies to any year
        uint8 month;                // calendar month for the drop date (1–12)
        uint8 day;                  // calendar day for the drop date (1–31)
        // Window
        uint64 startAt;             // unix timestamp; 0 = immediately active
        uint64 endAt;               // unix timestamp; 0 = never expires
        // Supply
        uint32 maxSupply;           // 0 = unlimited
        // Social conditions (all optional, stacked with AND)
        bool requireFollowsHost;    // claimer must follow the host
        uint32 minFollowers;        // claimer must have at least N followers; 0 = no minimum
        address[] requiredLSP7;     // claimer must hold balance > 0 of each token
        address[] requiredLSP8;     // claimer must hold ≥1 token of each collection
        // Presentation
        string name;                // "My Birthday Drop 2026"
        string imageIPFS;           // Pinata CID (no "ipfs://" prefix)
        bytes metadataBytes;        // ABI-encoded LSP4 metadata — same for every claimer
    }

    // ─────────────────────────────────────────────────────────────────────
    // Drop events
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Emitted when a new drop is created
    event DropCreated(
        bytes32 indexed dropId,
        address indexed host,
        uint8 celebrationType,
        uint64 startAt,
        uint64 endAt,
        uint32 maxSupply
    );

    /// @notice Emitted when a user successfully claims a drop badge
    event DropClaimed(
        bytes32 indexed dropId,
        address indexed claimer,
        bytes32 tokenId
    );

    // ─────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Raised when a soulbound badge transfer is attempted
    error BadgeSoulbound(bytes32 tokenId);

    /// @notice Raised when the caller is not authorized to mint
    error UnauthorizedMinter(address caller);

    /// @notice Raised when the badge for this owner/type/year already exists
    error BadgeAlreadyMinted(bytes32 tokenId);

    /// @notice Raised when the greeting card rate limit is exceeded
    error GreetingRateLimited(address sender, address recipient, uint256 nextAllowedAt);

    /// @notice Raised when the referenced drop does not exist
    error DropNotFound(bytes32 dropId);

    /// @notice Raised when the drop window is not open (before startAt or after endAt)
    error DropNotActive(bytes32 dropId);

    /// @notice Raised when the drop has reached its maxSupply
    error DropSoldOut(bytes32 dropId);

    /// @notice Raised when the caller has already claimed this drop
    error AlreadyClaimed(bytes32 dropId, address claimer);

    /// @notice Raised when the claimer does not meet eligibility conditions
    error EligibilityFailed(string reason);

    /// @notice Raised when an unauthorized address tries to manage a drop
    error UnauthorizedDropAction(address caller);
}
