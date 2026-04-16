// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "../interfaces/ICelebrationTypes.sol";

/// @title BadgeMetadata
/// @notice Helpers for generating badge names and descriptions on-chain.
///         Used by off-chain tools and optional on-chain metadata enrichment.
abstract contract BadgeMetadata is ICelebrationTypes {
    /// @notice Returns a human-readable name for a celebration type
    function celebrationTypeName(CelebrationType ct) internal pure returns (string memory) {
        if (ct == CelebrationType.Birthday)     return "Birthday";
        if (ct == CelebrationType.UPAnniversary) return "UP Anniversary";
        if (ct == CelebrationType.GlobalHoliday) return "Global Holiday";
        return "Custom Event";
    }

    /// @notice Returns the emoji associated with a celebration type
    function celebrationTypeEmoji(CelebrationType ct) internal pure returns (string memory) {
        if (ct == CelebrationType.Birthday)     return unicode"🎂";
        if (ct == CelebrationType.UPAnniversary) return unicode"🎉";
        if (ct == CelebrationType.GlobalHoliday) return unicode"🌍";
        return unicode"⭐";
    }
}
