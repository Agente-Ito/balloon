// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title ValidationUtils
/// @notice Shared validation helpers for Celebrations contracts.
library ValidationUtils {
    /// @notice Revert if `addr` is the zero address
    function requireNonZero(address addr, string memory label) internal pure {
        require(addr != address(0), string(abi.encodePacked(label, ": zero address")));
    }

    /// @notice Revert if `month` or `day` are out of calendar range
    function requireValidMonthDay(uint8 month, uint8 day) internal pure {
        require(month >= 1 && month <= 12, "ValidationUtils: invalid month");
        require(day >= 1 && day <= 31, "ValidationUtils: invalid day");
    }

    /// @notice Revert if `year` is in the past relative to `currentYear`
    function requireFutureOrCurrentYear(uint16 year, uint16 currentYear) internal pure {
        require(year >= currentYear, "ValidationUtils: year in the past");
    }
}
