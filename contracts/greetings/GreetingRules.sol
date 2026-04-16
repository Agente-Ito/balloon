// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title GreetingRules
/// @notice Rate-limiting constants and validation logic for greeting cards.
///         Extracted from GreetingCard to keep the main contract focused on minting.
abstract contract GreetingRules {
    /// @notice Rate limit window: 24 hours between cards from the same sender to the same recipient
    uint256 public constant RATE_LIMIT_WINDOW = 1 days;

    /// @notice Rate limit tracker: sender => recipient => last mint timestamp
    mapping(address => mapping(address => uint256)) public lastGreetingAt;

    /// @notice Returns the next allowed mint timestamp for a sender→recipient pair
    function nextAllowedAt(address sender, address recipient) public view virtual returns (uint256) {
        return lastGreetingAt[sender][recipient] + RATE_LIMIT_WINDOW;
    }

    /// @dev Check whether a sender is rate-limited for a given recipient
    function _isRateLimited(address sender, address recipient) internal view returns (bool) {
        return block.timestamp < lastGreetingAt[sender][recipient] + RATE_LIMIT_WINDOW;
    }

    /// @dev Record a new greeting, updating the rate-limit tracker
    function _recordGreeting(address sender, address recipient) internal {
        lastGreetingAt[sender][recipient] = block.timestamp;
    }
}
