// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp8-contracts/contracts/LSP8IdentifiableDigitalAsset.sol";
import {ICelebrationPassport} from "../interfaces/ICelebrationPassport.sol";
import {BadgeTypes} from "../badges/BadgeTypes.sol";

/// @title CelebrationPassport
/// @notice LSP8 soulbound "passport" — one token per Universal Profile.
///
///         Instead of minting a new NFT for every celebration, authorized callers
///         (CelebrationsDrop, CelebrationsDelegate) call `addStamp()`. The passport
///         is auto-minted on the first stamp. All stamps are stored on-chain in a
///         per-token mapping, making them fully queryable without an indexer.
///
///         TokenId: keccak256(abi.encodePacked(owner)) — deterministic, one per address.
///         Transfers are blocked (soulbound).
contract CelebrationPassport is LSP8IdentifiableDigitalAsset, ICelebrationPassport, BadgeTypes {
    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Addresses allowed to call addStamp (drop contract, delegate, owner)
    mapping(address => bool) public authorized;

    /// @dev tokenId → ordered list of stamps
    mapping(bytes32 => StampRecord[]) private _stamps;

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor()
        LSP8IdentifiableDigitalAsset(
            "Balloon Passport",
            "BPASS",
            msg.sender,
            LSP4_TOKEN_TYPE_NFT,
            TOKEN_ID_FORMAT_HASH
        )
    {}

    // ─────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────

    modifier onlyAuthorized() {
        require(
            authorized[msg.sender] || msg.sender == owner(),
            "CelebrationPassport: not authorized"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Core: addStamp
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc ICelebrationPassport
    function addStamp(address to, StampRecord calldata stamp)
        external
        onlyAuthorized
        returns (bytes32 tokenId)
    {
        tokenId = computeTokenId(to);

        // Auto-mint the passport on first stamp
        if (!_exists(tokenId)) {
            _mint(to, tokenId, false, "");
        }

        _stamps[tokenId].push(stamp);

        emit StampAdded(
            tokenId,
            to,
            stamp.celebrationType,
            stamp.year,
            stamp.month,
            stamp.day,
            stamp.dropId,
            stamp.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc ICelebrationPassport
    function getStamps(address owner_) external view returns (StampRecord[] memory) {
        return _stamps[computeTokenId(owner_)];
    }

    /// @inheritdoc ICelebrationPassport
    function computeTokenId(address owner_) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner_));
    }

    /// @inheritdoc ICelebrationPassport
    function hasPassport(address owner_) external view returns (bool) {
        return _exists(computeTokenId(owner_));
    }

    /// @inheritdoc ICelebrationPassport
    function stampCount(address owner_) external view returns (uint256) {
        return _stamps[computeTokenId(owner_)].length;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc ICelebrationPassport
    function setAuthorized(address addr, bool allowed) external onlyOwner {
        authorized[addr] = allowed;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Soulbound: block all post-mint transfers
    // ─────────────────────────────────────────────────────────────────────

    function _transfer(
        address from,
        address to,
        bytes32 tokenId,
        bool force,
        bytes memory data
    ) internal override {
        // Allow minting (from == address(0)), block everything else
        require(from == address(0), "CelebrationPassport: soulbound, non-transferable");
        super._transfer(from, to, tokenId, force, data);
    }
}
