// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IFollowRegistry} from "../interfaces/IFollowRegistry.sol";

/// @title FollowRegistry
/// @notice Thin wrapper around the LUKSO LSP26 FollowerSystem contract.
///         Provides a stable interface for on-chain social graph reads so that
///         other Celebrations contracts can query follower relationships without
///         hardcoding the LSP26 contract address everywhere.
///
/// Usage:
///   Deploy once, pointing at the official LSP26 contract address.
///   Other contracts that need social graph data call this registry.
contract FollowRegistry {
    /// @notice The deployed LSP26 FollowerSystem contract
    IFollowRegistry public immutable lsp26;

    constructor(address _lsp26) {
        require(_lsp26 != address(0), "FollowRegistry: zero address");
        lsp26 = IFollowRegistry(_lsp26);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Delegating reads to LSP26
    // ─────────────────────────────────────────────────────────────────────

    function followerCount(address addr) external view returns (uint256) {
        return lsp26.followerCount(addr);
    }

    function followingCount(address addr) external view returns (uint256) {
        return lsp26.followingCount(addr);
    }

    function isFollowing(address follower, address addr) external view returns (bool) {
        return lsp26.isFollowing(follower, addr);
    }

    /// @notice Returns up to `pageSize` followers of `addr` starting at `startIndex`
    function getFollowerPage(
        address addr,
        uint256 startIndex,
        uint256 pageSize
    ) external view returns (address[] memory) {
        uint256 total = lsp26.followerCount(addr);
        uint256 end   = startIndex + pageSize;
        if (end > total) end = total;
        if (startIndex >= end) return new address[](0);
        return lsp26.getFollowersByIndex(addr, startIndex, end);
    }

    /// @notice Returns up to `pageSize` addresses that `addr` follows starting at `startIndex`
    function getFollowingPage(
        address addr,
        uint256 startIndex,
        uint256 pageSize
    ) external view returns (address[] memory) {
        uint256 total = lsp26.followingCount(addr);
        uint256 end   = startIndex + pageSize;
        if (end > total) end = total;
        if (startIndex >= end) return new address[](0);
        return lsp26.getFollowsByIndex(addr, startIndex, end);
    }
}
