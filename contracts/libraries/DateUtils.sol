// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title DateUtils
/// @notice On-chain date arithmetic library using the Howard Hinnant algorithm.
///         Provides pure/view helpers for converting Unix timestamps to calendar dates
///         and parsing date strings stored in ERC725Y.
library DateUtils {
    /// @notice Convert a Unix timestamp to (year, month, day)
    /// @dev Algorithm: https://howardhinnant.github.io/date_algorithms.html
    function timestampToDate(uint256 timestamp)
        internal pure returns (uint16 year, uint16 month, uint16 day)
    {
        unchecked {
            uint256 z   = timestamp / 86400 + 719468;
            uint256 era = z / 146097;
            uint256 doe = z - era * 146097;
            uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
            uint256 y   = yoe + era * 400;
            uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
            uint256 mp  = (5 * doy + 2) / 153;
            day   = uint16(doy - (153 * mp + 2) / 5 + 1);
            month = uint16(mp < 10 ? mp + 3 : mp - 9);
            year  = uint16(month <= 2 ? y + 1 : y);
        }
    }

    /// @notice Returns the current block date as (year, month, day)
    function currentDate()
        internal view returns (uint16 year, uint16 month, uint16 day)
    {
        return timestampToDate(block.timestamp);
    }

    /// @notice Parse month and day from a "YYYY-MM-DD" bytes10 value
    /// @dev dateBytes layout: [Y][Y][Y][Y][-][M][M][-][D][D]  (indices 0–9)
    function parseMonthDay(bytes memory dateBytes)
        internal pure returns (uint16 month, uint16 day)
    {
        month = (uint16(uint8(dateBytes[5])) - 48) * 10 + (uint16(uint8(dateBytes[6])) - 48);
        day   = (uint16(uint8(dateBytes[8])) - 48) * 10 + (uint16(uint8(dateBytes[9])) - 48);
    }

    /// @notice Parse year, month and day from a "YYYY-MM-DD" bytes10 value
    function parseDate(bytes memory dateBytes)
        internal pure returns (uint16 year, uint16 month, uint16 day)
    {
        year  = (uint16(uint8(dateBytes[0])) - 48) * 1000
              + (uint16(uint8(dateBytes[1])) - 48) * 100
              + (uint16(uint8(dateBytes[2])) - 48) * 10
              + (uint16(uint8(dateBytes[3])) - 48);
        month = (uint16(uint8(dateBytes[5])) - 48) * 10 + (uint16(uint8(dateBytes[6])) - 48);
        day   = (uint16(uint8(dateBytes[8])) - 48) * 10 + (uint16(uint8(dateBytes[9])) - 48);
    }

    /// @notice Returns true if two (month, day) pairs are the same calendar date
    function isSameMonthDay(
        uint16 monthA, uint16 dayA,
        uint16 monthB, uint16 dayB
    ) internal pure returns (bool) {
        return monthA == monthB && dayA == dayB;
    }
}
