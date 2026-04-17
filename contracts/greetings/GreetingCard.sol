// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp8-contracts/contracts/LSP8IdentifiableDigitalAsset.sol";
import {IGreetingCard} from "../interfaces/IGreetingCard.sol";
import {GreetingRules} from "./GreetingRules.sol";
import {GreetingMetadata} from "./GreetingMetadata.sol";

/// @title GreetingCard
/// @notice LSP8 NFT contract for social greeting cards on LUKSO.
///         Any user can mint a card and send it to another Universal Profile.
///         TokenIds are sequential (uint256 cast to bytes32), format = 0 (Number).
///
/// Spam protection: one card per sender per recipient per day (86400 seconds).
contract GreetingCard is
    LSP8IdentifiableDigitalAsset,
    IGreetingCard,
    GreetingRules,
    GreetingMetadata
{
    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Monotonically increasing counter for tokenId generation
    uint256 public nextTokenId;

    // LSP8 tokenId format: 0 = Number (sequential uint256)
    uint256 private constant _TOKEN_ID_FORMAT_NUMBER = 0;

    // LSP4 token type: 1 = NFT
    uint256 private constant _LSP4_TOKEN_TYPE_NFT = 1;

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor()
        LSP8IdentifiableDigitalAsset(
            "Balloon Card",
            "BALLOON",
            msg.sender,
            _LSP4_TOKEN_TYPE_NFT,
            _TOKEN_ID_FORMAT_NUMBER
        )
    {}

    // ─────────────────────────────────────────────────────────────────────
    // Minting
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Mint a greeting card and send it to another Universal Profile.
    /// @param to               Recipient's Universal Profile address
    /// @param celebrationType  The celebration being acknowledged
    /// @param metadataBytes    ABI-encoded IPFS CID bytes for the card metadata (LSP4-compliant JSON)
    /// @param force            If true, allows minting to plain EOAs (use false in production)
    /// @return tokenId         The sequential tokenId of the minted card
    function mintCard(
        address to,
        CelebrationType celebrationType,
        bytes memory metadataBytes,
        bool force
    ) external returns (bytes32 tokenId) {
        if (_isRateLimited(msg.sender, to)) {
            revert GreetingRateLimited(msg.sender, to, nextAllowedAt(msg.sender, to));
        }

        require(msg.sender != to, "GreetingCard: cannot send to yourself");

        uint256 rawId = nextTokenId++;
        tokenId = bytes32(rawId);

        _recordGreeting(msg.sender, to);
        _mint(to, tokenId, force, metadataBytes);

        emit GreetingCardSent(msg.sender, to, tokenId, celebrationType);
    }

    // ─────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Returns the next allowed mint timestamp for a sender→recipient pair
    /// @dev Override needed to resolve the diamond between GreetingRules and IGreetingCard
    function nextAllowedAt(address sender, address recipient)
        public view override(GreetingRules, IGreetingCard)
        returns (uint256)
    {
        return lastGreetingAt[sender][recipient] + RATE_LIMIT_WINDOW;
    }

    /// @notice Returns all tokenIds received by a given address
    function cardsOf(address recipient) external view returns (bytes32[] memory) {
        return tokenIdsOf(recipient);
    }
}
