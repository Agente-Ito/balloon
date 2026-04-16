// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title IFollowRegistry
/// @notice Interface for querying the LUKSO LSP26 follower system.
///         This mirrors the LSP26FollowerSystem interface for on-chain social graph reads.
interface IFollowRegistry {
    /// @notice Returns the number of addresses following `addr`
    function followerCount(address addr) external view returns (uint256);

    /// @notice Returns the number of addresses that `addr` follows
    function followingCount(address addr) external view returns (uint256);

    /// @notice Returns true if `follower` follows `addr`
    function isFollowing(address follower, address addr) external view returns (bool);

    /// @notice Returns a page of followers for `addr`
    function getFollowersByIndex(
        address addr,
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (address[] memory);

    /// @notice Returns a page of addresses that `addr` follows
    function getFollowsByIndex(
        address addr,
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (address[] memory);
}
