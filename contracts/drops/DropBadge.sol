// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp8-contracts/contracts/LSP8IdentifiableDigitalAsset.sol";
import {_LSP4_METADATA_KEY} from "@lukso/lsp4-contracts/contracts/LSP4Constants.sol";
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

    // Custom token data key: who created the source drop for this claimed badge
    bytes32 private constant DROP_HOST_DATA_KEY = keccak256("app:celebrations:dropHost");

    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc IDropBadge
    address public override dropMinter;

    // tokenId => drop host that created the source campaign
    mapping(bytes32 => address) private _dropHostByToken;

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor()
        LSP8IdentifiableDigitalAsset(
            "Balloon Drop",
            "BALLOON",
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
        address host,
        bytes calldata metadataBytes,
        bool force
    ) external override returns (bytes32 tokenId) {
        require(msg.sender == dropMinter, "DropBadge: unauthorized minter");
        require(host != address(0), "DropBadge: host zero");

        tokenId = computeDropTokenId(to, dropId);
        require(!_exists(tokenId), "DropBadge: already claimed");

        _mint(to, tokenId, force, metadataBytes);
        _dropHostByToken[tokenId] = host;

        // Persist creator info on token data so indexers/UIs can display who created the drop.
        _setDataForTokenId(tokenId, DROP_HOST_DATA_KEY, abi.encode(host));
    }

    /// @inheritdoc IDropBadge
    function setTokenMetadataAsHost(bytes32 tokenId, bytes calldata metadataBytes) external override {
        require(_exists(tokenId), "DropBadge: unknown token");
        require(_dropHostByToken[tokenId] == msg.sender, "DropBadge: not drop host");

        _setDataForTokenId(tokenId, _LSP4_METADATA_KEY, metadataBytes);
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

    /// @inheritdoc IDropBadge
    function dropHostOf(bytes32 tokenId) external view override returns (address) {
        return _dropHostByToken[tokenId];
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
