// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ICelebrationsDrop} from "../interfaces/ICelebrationsDrop.sol";
import {ICelebrationPassport} from "../interfaces/ICelebrationPassport.sol";
import {IFollowRegistry} from "../interfaces/IFollowRegistry.sol";

/// @title CelebrationsDrop
/// @notice Social badge-drop hub for the Celebrations dApp on LUKSO.
///
///         Anyone with a Universal Profile can create a drop campaign with
///         an optional time window, supply cap, and social eligibility gates
///         (follow, follower count, LSP7 token holdings, LSP8 NFT holdings).
///         Eligible users claim a stamp on their CelebrationPassport instead of
///         receiving a new NFT, keeping profiles clean regardless of participation count.
///
///         Drop lifecycle:
///           createDrop → [startAt] → claim window open → [endAt | sold out] → closed
///           Host can cancelDrop at any time.
///
///         Storage layout:
///           _drops[dropId]                   → DropConfig
///           _claimed[dropId]                 → running claim count
///           _hasClaimed[dropId][claimer]     → bool
///           _hostDrops[host]                 → ordered dropId list (oldest first)
///           _dropCount[host]                 → nonce for deterministic dropId
contract CelebrationsDrop is ICelebrationsDrop, Ownable {
    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    ICelebrationPassport public passport;
    IFollowRegistry      public immutable followRegistry;

    mapping(bytes32 => DropConfig)                      private _drops;
    mapping(bytes32 => uint32)                          private _claimed;
    mapping(bytes32 => mapping(address => bool))        private _hasClaimed;
    mapping(address => bytes32[])                       private _hostDrops;
    mapping(address => uint256)                         private _dropCount;

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor(address _passport, address _followRegistry) {
        require(_followRegistry != address(0), "CelebrationsDrop: followRegistry zero");
        passport       = ICelebrationPassport(_passport);
        followRegistry = IFollowRegistry(_followRegistry);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Update the passport contract address (only owner)
    function setPassport(address _passport) external onlyOwner {
        passport = ICelebrationPassport(_passport);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Host actions
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc ICelebrationsDrop
    function createDrop(DropConfig calldata cfg) external override returns (bytes32 dropId) {
        require(cfg.host == msg.sender,        "CelebrationsDrop: host mismatch");
        require(bytes(cfg.name).length > 0,    "CelebrationsDrop: empty name");
        require(cfg.month >= 1 && cfg.month <= 12, "CelebrationsDrop: invalid month");
        require(cfg.day   >= 1 && cfg.day   <= 31, "CelebrationsDrop: invalid day");
        require(
            cfg.endAt == 0 || cfg.endAt > cfg.startAt,
            "CelebrationsDrop: endAt must be after startAt"
        );
        require(cfg.requiredLSP7.length <= 5, "CelebrationsDrop: too many LSP7 gates");
        require(cfg.requiredLSP8.length <= 5, "CelebrationsDrop: too many LSP8 gates");

        // Deterministic dropId — unique per host via nonce
        uint256 nonce = _dropCount[msg.sender];
        dropId = keccak256(abi.encodePacked(msg.sender, nonce));
        _dropCount[msg.sender] = nonce + 1;

        _drops[dropId] = cfg;
        _hostDrops[msg.sender].push(dropId);

        emit DropCreated(dropId, msg.sender, cfg.celebrationType, cfg.startAt, cfg.endAt, cfg.maxSupply);
    }

    /// @inheritdoc ICelebrationsDrop
    function cancelDrop(bytes32 dropId) external override {
        DropConfig storage cfg = _drops[dropId];
        if (cfg.host == address(0)) revert DropNotFound(dropId);
        if (cfg.host != msg.sender) revert UnauthorizedDropAction(msg.sender);

        // Close the window immediately
        cfg.endAt = uint64(block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Claimer actions
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc ICelebrationsDrop
    function claim(bytes32 dropId, bool force) external override {
        DropConfig storage cfg = _drops[dropId];

        // 1. Drop exists
        if (cfg.host == address(0)) revert DropNotFound(dropId);

        // 2. Window is open
        if (!_isWindowOpen(cfg)) revert DropNotActive(dropId);

        // 3. Supply
        if (cfg.maxSupply > 0 && _claimed[dropId] >= cfg.maxSupply) revert DropSoldOut(dropId);

        // 4. Not already claimed
        if (_hasClaimed[dropId][msg.sender]) revert AlreadyClaimed(dropId, msg.sender);

        // 5. Social conditions
        (bool ok, string memory reason) = _checkConditions(cfg, msg.sender);
        if (!ok) revert EligibilityFailed(reason);

        // Record before external call (checks-effects-interactions)
        _hasClaimed[dropId][msg.sender] = true;
        _claimed[dropId] += 1;

        // Add a stamp to the claimer's passport instead of minting a new token
        ICelebrationPassport.StampRecord memory stamp = ICelebrationPassport.StampRecord({
            celebrationType: cfg.celebrationType,
            year:            cfg.year,
            month:           cfg.month,
            day:             cfg.day,
            dropId:          dropId,
            timestamp:       uint64(block.timestamp)
        });

        bytes32 tokenId = address(passport) != address(0)
            ? passport.addStamp(msg.sender, stamp)
            : bytes32(0);

        // `force` kept in signature for API compatibility; passport ignores it (always mints to UP)
        (force);

        emit DropClaimed(dropId, msg.sender, tokenId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────

    /// @inheritdoc ICelebrationsDrop
    function checkEligibility(bytes32 dropId, address claimer)
        external view override returns (bool ok, string memory reason)
    {
        DropConfig storage cfg = _drops[dropId];

        if (cfg.host == address(0))          return (false, "Drop not found");
        if (!_isWindowOpen(cfg))             return (false, "Drop window not open");
        if (cfg.maxSupply > 0 && _claimed[dropId] >= cfg.maxSupply)
                                             return (false, "Drop sold out");
        if (_hasClaimed[dropId][claimer])    return (false, "Already claimed");

        return _checkConditions(cfg, claimer);
    }

    /// @inheritdoc ICelebrationsDrop
    function getDrop(bytes32 dropId) external view override returns (DropConfig memory) {
        return _drops[dropId];
    }

    /// @inheritdoc ICelebrationsDrop
    function getDropsByHost(address host) external view override returns (bytes32[] memory) {
        bytes32[] storage ids = _hostDrops[host];
        // Return reversed (most recent first)
        uint256 len = ids.length;
        bytes32[] memory result = new bytes32[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = ids[len - 1 - i];
        }
        return result;
    }

    /// @inheritdoc ICelebrationsDrop
    function claimedCount(bytes32 dropId) external view override returns (uint32) {
        return _claimed[dropId];
    }

    /// @inheritdoc ICelebrationsDrop
    function hasClaimed(bytes32 dropId, address claimer) external view override returns (bool) {
        return _hasClaimed[dropId][claimer];
    }

    /// @inheritdoc ICelebrationsDrop
    function dropCountByHost(address host) external view override returns (uint256) {
        return _dropCount[host];
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────

    function _isWindowOpen(DropConfig storage cfg) private view returns (bool) {
        uint64 ts = uint64(block.timestamp);
        if (cfg.startAt > 0 && ts < cfg.startAt) return false;
        if (cfg.endAt   > 0 && ts > cfg.endAt)   return false;
        return true;
    }

    /// @dev Check all social / token conditions. Returns (false, reason) on first failure.
    function _checkConditions(DropConfig storage cfg, address claimer)
        private view returns (bool, string memory)
    {
        // Must follow host
        if (cfg.requireFollowsHost) {
            if (!followRegistry.isFollowing(claimer, cfg.host)) {
                return (false, "Must follow the host");
            }
        }

        // Minimum follower count
        if (cfg.minFollowers > 0) {
            if (followRegistry.followerCount(claimer) < cfg.minFollowers) {
                return (false, "Insufficient followers");
            }
        }

        // Required LSP7 token holdings
        for (uint256 i = 0; i < cfg.requiredLSP7.length; i++) {
            if (!_hasLSP7Balance(cfg.requiredLSP7[i], claimer)) {
                return (false, "Missing required LSP7 token");
            }
        }

        // Required LSP8 NFT holdings
        for (uint256 i = 0; i < cfg.requiredLSP8.length; i++) {
            if (!_hasLSP8Token(cfg.requiredLSP8[i], claimer)) {
                return (false, "Missing required LSP8 token");
            }
        }

        return (true, "");
    }

    /// @dev Low-level check: does `holder` have LSP7 balance > 0 at `token`?
    function _hasLSP7Balance(address token, address holder) private view returns (bool) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSelector(0x70a08231, holder)
        );
        if (!success || data.length < 32) return false;
        return abi.decode(data, (uint256)) > 0;
    }

    /// @dev Low-level check: does `holder` have LSP8 tokenCount > 0 at `collection`?
    function _hasLSP8Token(address collection, address holder) private view returns (bool) {
        (bool success, bytes memory data) = collection.staticcall(
            abi.encodeWithSelector(0x70a08231, holder)
        );
        if (!success || data.length < 32) return false;
        return abi.decode(data, (uint256)) > 0;
    }
}
