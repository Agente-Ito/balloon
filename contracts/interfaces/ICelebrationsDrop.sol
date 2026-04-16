// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "./ICelebrationTypes.sol";

/// @title ICelebrationsDrop
/// @notice Interface for the CelebrationsDrop contract — the hub for social badge drops.
interface ICelebrationsDrop is ICelebrationTypes {
    // ─────────────────────────────────────────────────────────────────────
    // Host actions
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Create a new drop campaign.
    ///         dropId = keccak256(host, hostNonce) — deterministic and unique per host.
    /// @param cfg  The full drop configuration. cfg.host must equal msg.sender.
    /// @return dropId The computed drop identifier
    function createDrop(DropConfig calldata cfg) external returns (bytes32 dropId);

    /// @notice Cancel an active drop (only the host can cancel).
    ///         Sets endAt to block.timestamp, effectively closing the window.
    function cancelDrop(bytes32 dropId) external;

    // ─────────────────────────────────────────────────────────────────────
    // Claimer actions
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Claim a drop badge. Reverts with a specific error if any condition fails.
    /// @param force Pass false in production (Universal Profiles); true only for EOA test accounts.
    function claim(bytes32 dropId, bool force) external;

    // ─────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Off-chain eligibility check — no gas cost, safe to call from frontend.
    /// @return ok     True if the claimer meets all conditions
    /// @return reason Human-readable failure reason (empty string when ok == true)
    function checkEligibility(bytes32 dropId, address claimer)
        external view returns (bool ok, string memory reason);

    /// @notice Fetch the full config for a drop
    function getDrop(bytes32 dropId) external view returns (DropConfig memory);

    /// @notice List all dropIds created by `host` (most recent first)
    function getDropsByHost(address host) external view returns (bytes32[] memory);

    /// @notice How many times a drop has been claimed so far
    function claimedCount(bytes32 dropId) external view returns (uint32);

    /// @notice Whether `claimer` has already claimed `dropId`
    function hasClaimed(bytes32 dropId, address claimer) external view returns (bool);

    /// @notice Total number of drops created by `host`
    function dropCountByHost(address host) external view returns (uint256);
}
