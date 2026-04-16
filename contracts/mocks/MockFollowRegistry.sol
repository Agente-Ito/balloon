// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IFollowRegistry} from "../interfaces/IFollowRegistry.sol";

/// @title MockFollowRegistry
/// @notice Controllable follow registry for testing CelebrationsDrop eligibility conditions.
contract MockFollowRegistry is IFollowRegistry {
    // follower → followed → bool
    mapping(address => mapping(address => bool)) private _following;
    mapping(address => uint256) private _followerCounts;

    function setFollowing(address follower, address followed, bool state) external {
        _following[follower][followed] = state;
    }

    function setFollowerCount(address addr, uint256 count) external {
        _followerCounts[addr] = count;
    }

    function isFollowing(address follower, address addr) external view override returns (bool) {
        return _following[follower][addr];
    }

    function followerCount(address addr) external view override returns (uint256) {
        return _followerCounts[addr];
    }

    function followingCount(address addr) external view override returns (uint256) { return 0; }

    function getFollowersByIndex(address, uint256, uint256) external pure override returns (address[] memory) {
        return new address[](0);
    }

    function getFollowsByIndex(address, uint256, uint256) external pure override returns (address[] memory) {
        return new address[](0);
    }
}
