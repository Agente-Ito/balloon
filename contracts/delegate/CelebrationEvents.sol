// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "../interfaces/ICelebrationTypes.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title CelebrationEvents
/// @notice LSP1 typeId constants and gift-event helpers for the delegate.
///         Centralises the protocol-level constants so the main delegate contract
///         stays focused on orchestration.
abstract contract CelebrationEvents is ICelebrationTypes {
    /// @notice ERC165 interface ID for the GreetingCard contract.
    /// Used in _handleLSP8Received to distinguish greeting cards from other NFTs.
    bytes4 internal constant GREETING_CARD_INTERFACE_ID = 0x1a762860;

    // ─────────────────────────────────────────────────────────────────────
    // LSP1 typeId constants
    // Source: @lukso/lsp1-contracts LSP1Constants.sol
    // ─────────────────────────────────────────────────────────────────────

    bytes32 internal constant TYPEID_LSP7_TOKENS_RECIPIENT =
        0x429ac7a06903dbc9c13dfcb3c9d11df8194581fa047c96d7a4171fc7402958ea;

    bytes32 internal constant TYPEID_LSP8_TOKENS_RECIPIENT =
        0x20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c;

    // ─────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────

    /// @dev Handle inbound LSP8 token.
    /// If the token contract exposes the GreetingCard interface, emit CelebrationGiftReceived
    /// with CustomEvent type (sender context unknown at this point — the indexer resolves it).
    /// For all other LSP8 tokens emit a generic gift event.
    function _handleLSP8Received(
        address profile,
        address tokenContract,
        bytes memory /*data*/
    ) internal {
        // Check if the inbound token is a GreetingCard via ERC165
        bool isGreetingCard = false;
        try IERC165(tokenContract).supportsInterface(GREETING_CARD_INTERFACE_ID) returns (bool supported) {
            isGreetingCard = supported;
        } catch {}

        emit CelebrationGiftReceived(
            profile,
            tokenContract,
            tokenContract,
            isGreetingCard ? CelebrationType.CustomEvent : CelebrationType.CustomEvent
        );
    }

    /// @dev Handle inbound LSP7 token (fungible gift)
    ///      LSP7 data layout: abi.encode(operator, from, to, amount, operatorNotificationData)
    function _handleLSP7Received(
        address profile,
        address tokenContract,
        bytes memory data
    ) internal {
        (, address from,,) = abi.decode(data, (address, address, address, uint256));
        emit CelebrationGiftReceived(profile, from, tokenContract, CelebrationType.CustomEvent);
    }
}
