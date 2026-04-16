// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title ERC725Keys
/// @notice Precomputed keccak256 key hashes for Celebrations dApp ERC725Y data.
///         These constants are used by the delegate and any contract that needs to
///         read or write to Universal Profile storage.
library ERC725Keys {
    /// @notice "app:celebrations:birthday" — YYYY-MM-DD string (bytes10)
    bytes32 internal constant KEY_BIRTHDAY =
        keccak256("app:celebrations:birthday");

    /// @notice "app:celebrations:profileCreatedAt" — uint256 unix timestamp (bytes32)
    bytes32 internal constant KEY_PROFILE_CREATED_AT =
        keccak256("app:celebrations:profileCreatedAt");

    /// @notice "app:celebrations:settings" — JSONURL IPFS CID for ProfileSettings JSON
    bytes32 internal constant KEY_SETTINGS =
        keccak256("app:celebrations:settings");

    /// @notice "app:celebrations:events[]" — LSP2 array key for custom events
    bytes32 internal constant KEY_EVENTS_ARRAY =
        keccak256("app:celebrations:events[]");

    /// @notice "app:celebrations:wishlist[]" — LSP2 array key for wishlist items
    bytes32 internal constant KEY_WISHLIST_ARRAY =
        keccak256("app:celebrations:wishlist[]");
}
