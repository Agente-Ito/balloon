// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "./ICelebrationTypes.sol";

/// @title ICelebrationsBadge
/// @notice Interface for the CelebrationsBadge LSP8 contract
interface ICelebrationsBadge is ICelebrationTypes {
    function mintBadge(
        address to,
        CelebrationType celebrationType,
        uint16 year,
        bool soulbound,
        bytes memory metadataBytes,
        bool force
    ) external returns (bytes32 tokenId);

    function computeTokenId(
        address owner,
        CelebrationType celebrationType,
        uint16 year
    ) external pure returns (bytes32);

    function badgeExists(
        address owner,
        CelebrationType celebrationType,
        uint16 year
    ) external view returns (bool);
}
