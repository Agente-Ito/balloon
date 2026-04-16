// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationRegistry} from "../interfaces/ICelebrationRegistry.sol";

/// @title GlobalFestivities
/// @notice Read-only storage of globally recognised festivities (Christmas, New Year, etc.).
///         Pre-populated at deploy time. Additional festivity management is in CelebrationRegistry.
abstract contract GlobalFestivities is ICelebrationRegistry {
    Festivity[] internal _festivities;

    constructor() {
        // Gregorian calendar fixed dates
        _festivities.push(Festivity(1,  1,  "New Year's Day",   CelebrationType.GlobalHoliday));
        _festivities.push(Festivity(2,  14, "Valentine's Day",  CelebrationType.GlobalHoliday));
        _festivities.push(Festivity(3,  8,  "International Women's Day", CelebrationType.GlobalHoliday));
        _festivities.push(Festivity(4,  22, "Earth Day",        CelebrationType.GlobalHoliday));
        _festivities.push(Festivity(5,  1,  "International Workers' Day", CelebrationType.GlobalHoliday));
        _festivities.push(Festivity(10, 31, "Halloween",        CelebrationType.GlobalHoliday));
        _festivities.push(Festivity(12, 24, "Christmas Eve",    CelebrationType.GlobalHoliday));
        _festivities.push(Festivity(12, 25, "Christmas Day",    CelebrationType.GlobalHoliday));
        _festivities.push(Festivity(12, 31, "New Year's Eve",   CelebrationType.GlobalHoliday));
    }

    /// @inheritdoc ICelebrationRegistry
    function getFestivities() external view returns (Festivity[] memory) {
        return _festivities;
    }

    /// @inheritdoc ICelebrationRegistry
    function getFestivitiesOnDate(uint8 month, uint8 day) external view returns (Festivity[] memory) {
        uint256 count;
        for (uint256 i; i < _festivities.length; ) {
            if (_festivities[i].month == month && _festivities[i].day == day) count++;
            unchecked { i++; }
        }

        Festivity[] memory result = new Festivity[](count);
        uint256 idx;
        for (uint256 i; i < _festivities.length; ) {
            if (_festivities[i].month == month && _festivities[i].day == day) {
                result[idx++] = _festivities[i];
            }
            unchecked { i++; }
        }
        return result;
    }
}
