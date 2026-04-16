// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp8-contracts/contracts/LSP8IdentifiableDigitalAsset.sol";
import {IDropBadge} from "../interfaces/IDropBadge.sol";

/// @title DropBadge
/// @notice LSP8 NFT contract for social badge drops on the Celebrations dApp.
///
///         TokenId format: keccak256(claimer, dropId)
///           — one badge per (claimer, drop), separating drop badges from
///             personal celebration badges (CelebrationsBadge).
///
/// Access control:
///   - Only the authorised `dropMinter` address (CelebrationsDrop) can mint.
///   - The contract owner (deployer) can update `dropMinter`.
contract DropBadge is LSP8IdentifiableDigitalAsset, IDropBadge {
    // ─────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────

    // LSP8 tokenId format: 4 = keccak256 hash (bytes32)
    uint256 private constant TOKEN_ID_FORMAT_HASH = 4;

    // LSP4 token type: 1 = NFT
    uint256 private constant LSP4_TOKEN_TYPE_NFT = 1;

    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc IDropBadge
    address public override dropMinter;

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor()
        LSP8IdentifiableDigitalAsset(
            "Celebrations Drop Badge",
            "CLBDRP",
            msg.sender,
            LSP4_TOKEN_TYPE_NFT,
            TOKEN_ID_FORMAT_HASH
        )
    {}

    // ─────────────────────────────────────────────────────────────────────
    // Minting
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc IDropBadge
    function mintForDrop(
        address to,
        bytes32 dropId,
        bytes calldata metadataBytes,
        bool force
    ) external override returns (bytes32 tokenId) {
        require(msg.sender == dropMinter, "DropBadge: unauthorized minter");

        tokenId = computeDropTokenId(to, dropId);
        require(!_exists(tokenId), "DropBadge: already claimed");

        _mint(to, tokenId, force, metadataBytes);
    }

    // ─────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc IDropBadge
    function computeDropTokenId(address claimer, bytes32 dropId)
        public pure override returns (bytes32)
    {
        return keccak256(abi.encodePacked(claimer, dropId));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc IDropBadge
    function setDropMinter(address minter) external override onlyOwner {
        require(minter != address(0), "DropBadge: zero address");
        dropMinter = minter;
    }
}
