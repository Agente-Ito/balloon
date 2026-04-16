// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "../interfaces/ICelebrationTypes.sol";
import {DateUtils} from "../libraries/DateUtils.sol";
import {ProfileUtils} from "../libraries/ProfileUtils.sol";
import {ERC725Keys} from "../libraries/ERC725Keys.sol";

/// @title CelebrationEligibility
/// @notice Internal logic for checking whether a Universal Profile qualifies for
///         automatic celebration detection (birthday, UP anniversary).
///         Extracted from CelebrationsDelegate to keep it focused on LSP1 dispatch.
abstract contract CelebrationEligibility is ICelebrationTypes {
    using DateUtils for uint256;

    // ─────────────────────────────────────────────────────────────────────
    // Birthday eligibility
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Check if a profile's birthday matches today
    /// @param birthdayData  Raw bytes read from the profile's birthday ERC725Y key (must be 10 bytes)
    /// @return isMatch      True if month/day matches today
    /// @return currentYear  Current year (for auto-mint year tracking)
    function _isBirthdayToday(address /* profile */, bytes memory birthdayData)
        internal view returns (bool isMatch, uint16 currentYear)
    {
        if (birthdayData.length != 10) return (false, 0);

        (uint16 storedMonth, uint16 storedDay) = DateUtils.parseMonthDay(birthdayData);
        uint16 currentMonth;
        uint16 currentDay;
        (currentYear, currentMonth, currentDay) = DateUtils.currentDate();

        isMatch = DateUtils.isSameMonthDay(storedMonth, storedDay, currentMonth, currentDay);
    }

    // ─────────────────────────────────────────────────────────────────────
    // UP Anniversary eligibility
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Check if a profile's UP creation anniversary matches today
    /// @param createdAtData  Raw bytes read from the profile's createdAt ERC725Y key (must be 32 bytes)
    /// @return isMatch       True if month/day matches today AND at least 1 year has passed
    /// @return currentYear   Current year
    /// @return yearsOld      Number of years since UP creation
    function _isAnniversaryToday(bytes memory createdAtData)
        internal view returns (bool isMatch, uint16 currentYear, uint256 yearsOld)
    {
        if (createdAtData.length != 32) return (false, 0, 0);

        uint256 createdAt = abi.decode(createdAtData, (uint256));
        if (createdAt == 0) return (false, 0, 0);

        (uint16 createdYear, uint16 createdMonth, uint16 createdDay) = DateUtils.timestampToDate(createdAt);
        uint16 currentMonth;
        uint16 currentDay;
        (currentYear, currentMonth, currentDay) = DateUtils.currentDate();

        if (DateUtils.isSameMonthDay(createdMonth, createdDay, currentMonth, currentDay)
            && currentYear > createdYear)
        {
            isMatch  = true;
            yearsOld = currentYear - createdYear;
        }
    }
}
