// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title MockEOAReceiver
/// @notice Placeholder contract that deliberately does NOT implement LSP1.
///         Used in tests to verify that force=false minting correctly reverts
///         when the recipient is not a Universal Profile.
///
/// This contract has no functions — it behaves like a plain EOA from the perspective
/// of LSP8's `_notifyTokenReceiver` check.
contract MockEOAReceiver {
    // Intentionally empty — no LSP1 implementation
}
