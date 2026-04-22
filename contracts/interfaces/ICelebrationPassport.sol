// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title ICelebrationPassport
/// @notice Interface for the CelebrationPassport LSP8 contract.
///         One soulbound passport per user. Each celebration adds a stamp instead of minting a new token.
interface ICelebrationPassport {
    // ─────────────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────────────

    /// @notice A single stamp recorded on the passport
    /// @param celebrationType  uint8 cast of CelebrationType enum
    /// @param year             Calendar year (e.g. 2026)
    /// @param month            Calendar month (1–12); 0 = unknown
    /// @param day              Calendar day (1–31); 0 = unknown
    /// @param dropId           Source drop id; bytes32(0) for personal / delegate stamps
    /// @param timestamp        block.timestamp when the stamp was added
    struct StampRecord {
        uint8   celebrationType;
        uint16  year;
        uint8   month;
        uint8   day;
        bytes32 dropId;
        uint64  timestamp;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────

    event StampAdded(
        bytes32 indexed tokenId,
        address indexed owner,
        uint8   celebrationType,
        uint16  year,
        uint8   month,
        uint8   day,
        bytes32 dropId,
        uint64  timestamp
    );

    // ─────────────────────────────────────────────────────────────────────
    // Mutating
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Add a stamp to `to`'s passport. Auto-mints the passport on first call.
    ///         Only callable by authorized addresses (drop contract, delegate, owner).
    /// @return tokenId  The passport tokenId for `to`
    function addStamp(address to, StampRecord calldata stamp) external returns (bytes32 tokenId);

    // ─────────────────────────────────────────────────────────────────────
    // View
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Returns all stamps for `owner`
    function getStamps(address owner) external view returns (StampRecord[] memory);

    /// @notice Deterministic passport tokenId for an owner address
    function computeTokenId(address owner) external pure returns (bytes32);

    /// @notice Returns true if the passport has been minted for `owner`
    function hasPassport(address owner) external view returns (bool);

    /// @notice Returns the number of stamps on `owner`'s passport
    function stampCount(address owner) external view returns (uint256);

    // ─────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Grant or revoke stamp-writing permission for an address
    function setAuthorized(address addr, bool allowed) external;
}
