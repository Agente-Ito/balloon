// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp8-contracts/contracts/LSP8IdentifiableDigitalAsset.sol";
import {ICelebrationsBadge} from "../interfaces/ICelebrationsBadge.sol";
import {BadgeTypes} from "./BadgeTypes.sol";
import {BadgeMetadata} from "./BadgeMetadata.sol";

/// @title CelebrationsBadge
/// @notice LSP8 NFT contract that mints commemorative badges for celebrations on LUKSO.
///         TokenId format: keccak256(owner, celebrationType, year) — one badge per owner/type/year.
///         Badges can optionally be soulbound (non-transferable).
///
/// Access control:
///   - Owner of the contract (deployer) can mint for anyone.
///   - A registered delegate address can mint on behalf of users.
///   - Any user can mint a badge for themselves.
contract CelebrationsBadge is
    LSP8IdentifiableDigitalAsset,
    ICelebrationsBadge,
    BadgeTypes,
    BadgeMetadata
{
    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Address of the CelebrationsDelegate (LSP1 URD) — allowed to mint
    address public delegate;

    /// @notice Per-tokenId soulbound flag
    mapping(bytes32 => bool) public isSoulbound;

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor(address _delegate)
        LSP8IdentifiableDigitalAsset(
            "Balloon Badge",
            "BALLOON",
            msg.sender,
            LSP4_TOKEN_TYPE_NFT,
            TOKEN_ID_FORMAT_HASH
        )
    {
        delegate = _delegate;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Minting
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Mint a commemorative badge.
    /// @param to               Recipient — should be a Universal Profile
    /// @param celebrationType  The type of celebration
    /// @param year             The year of the celebration (e.g. 2026)
    /// @param soulbound        If true, the badge cannot be transferred after minting
    /// @param metadataBytes    ABI-encoded IPFS CID bytes for LSP4/token metadata
    /// @param force            If true, allows minting to plain EOAs (use false in production)
    /// @return tokenId         The computed deterministic tokenId
    function mintBadge(
        address to,
        CelebrationType celebrationType,
        uint16 year,
        bool soulbound,
        bytes memory metadataBytes,
        bool force
    ) external returns (bytes32 tokenId) {
        if (msg.sender != to && msg.sender != delegate && msg.sender != owner()) {
            revert UnauthorizedMinter(msg.sender);
        }

        tokenId = computeTokenId(to, celebrationType, year);

        if (_exists(tokenId)) {
            revert BadgeAlreadyMinted(tokenId);
        }

        isSoulbound[tokenId] = soulbound;
        _mint(to, tokenId, force, metadataBytes);

        emit BadgeMinted(to, tokenId, celebrationType, year);
    }

    // ─────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Compute the deterministic tokenId for a badge
    function computeTokenId(
        address owner,
        CelebrationType celebrationType,
        uint16 year
    ) public pure override returns (bytes32) {
        return _badgeTokenId(owner, celebrationType, year);
    }

    /// @notice Check if a badge has already been minted for a given owner/type/year
    function badgeExists(
        address owner,
        CelebrationType celebrationType,
        uint16 year
    ) external view override returns (bool) {
        return _exists(computeTokenId(owner, celebrationType, year));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Update the delegate address (only contract owner)
    function setDelegate(address _delegate) external onlyOwner {
        delegate = _delegate;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Soulbound enforcement
    // ─────────────────────────────────────────────────────────────────────

    /// @dev Override LSP8 internal transfer to block transfers for soulbound badges.
    ///      Minting (from == address(0)) is always allowed.
    function _transfer(
        address from,
        address to,
        bytes32 tokenId,
        bool force,
        bytes memory data
    ) internal override {
        if (from != address(0) && isSoulbound[tokenId]) {
            revert BadgeSoulbound(tokenId);
        }
        super._transfer(from, to, tokenId, force, data);
    }
}
