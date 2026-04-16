// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "../interfaces/ICelebrationTypes.sol";

/// @title GreetingMetadata
/// @notice On-chain metadata helpers for greeting cards.
///         Provides human-readable labels and emoji for celebration types,
///         consistent with the badge metadata helpers.
abstract contract GreetingMetadata is ICelebrationTypes {
    /// @notice Returns a greeting label for a given celebration type
    function greetingLabel(CelebrationType ct) internal pure returns (string memory) {
        if (ct == CelebrationType.Birthday)      return "Happy Birthday!";
        if (ct == CelebrationType.UPAnniversary) return "Happy UP Anniversary!";
        if (ct == CelebrationType.GlobalHoliday) return "Happy Holidays!";
        return "Congratulations!";
    }
}
