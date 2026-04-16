// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "./ICelebrationTypes.sol";

/// @title IGreetingCard
/// @notice Interface for the GreetingCard LSP8 contract
interface IGreetingCard is ICelebrationTypes {
    function mintCard(
        address to,
        CelebrationType celebrationType,
        bytes memory metadataBytes,
        bool force
    ) external returns (bytes32 tokenId);

    function nextAllowedAt(address sender, address recipient) external view returns (uint256);

    function cardsOf(address recipient) external view returns (bytes32[] memory);
}
