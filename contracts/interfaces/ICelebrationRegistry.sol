// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "./ICelebrationTypes.sol";

/// @title ICelebrationRegistry
/// @notice Interface for the CelebrationRegistry — tracks global festivities and
///         allows discovery of upcoming celebrations for any Universal Profile
interface ICelebrationRegistry is ICelebrationTypes {
    struct Festivity {
        uint8  month;
        uint8  day;
        string name;
        CelebrationType celebrationType;
    }

    /// @notice Returns all globally registered festivities
    function getFestivities() external view returns (Festivity[] memory);

    /// @notice Returns festivities occurring on a given month/day
    function getFestivitiesOnDate(uint8 month, uint8 day) external view returns (Festivity[] memory);
}
