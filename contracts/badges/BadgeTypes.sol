// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "../interfaces/ICelebrationTypes.sol";

/// @title BadgeTypes
/// @notice Badge-specific constants and type helpers.
///         Centralises LSP8 constructor parameters and soulbound flag logic.
abstract contract BadgeTypes is ICelebrationTypes {
    // LSP8 tokenId format: 4 = keccak256 hash (bytes32)
    uint256 internal constant TOKEN_ID_FORMAT_HASH = 4;

    // LSP4 token type: 1 = NFT
    uint256 internal constant LSP4_TOKEN_TYPE_NFT = 1;

    /// @notice Compute the deterministic tokenId for a badge
    /// @param owner           The recipient / owner address
    /// @param celebrationType The type of celebration
    /// @param year            The year of the celebration
    function _badgeTokenId(
        address owner,
        CelebrationType celebrationType,
        uint16 year
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner, uint8(celebrationType), year));
    }
}
