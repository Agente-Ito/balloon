// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC725Y} from "@erc725/smart-contracts/contracts/interfaces/IERC725Y.sol";

/// @title ProfileUtils
/// @notice Utilities for safely reading ERC725Y data from Universal Profiles.
///         Uses low-level staticcall to avoid ABI-decode panics when calling plain EOAs.
library ProfileUtils {
    /// @notice Safely read a single ERC725Y key from an external contract.
    ///         Returns empty bytes if the call fails or returns insufficient data
    ///         (e.g., when the target is an EOA or does not implement ERC725Y).
    /// @param target  The Universal Profile (or any ERC725Y) address
    /// @param key     The ERC725Y data key to read
    /// @return data   The stored bytes, or "" if unavailable
    function safeGetData(address target, bytes32 key) internal view returns (bytes memory data) {
        (bool success, bytes memory returnData) = target.staticcall(
            abi.encodeWithSelector(IERC725Y.getData.selector, key)
        );
        if (!success || returnData.length < 64) return "";
        return abi.decode(returnData, (bytes));
    }

    /// @notice Check whether an address implements a given ERC165 interface.
    ///         Returns false if the call reverts or the address is an EOA.
    function supportsInterface(address target, bytes4 interfaceId) internal view returns (bool) {
        (bool success, bytes memory result) = target.staticcall(
            abi.encodeWithSignature("supportsInterface(bytes4)", interfaceId)
        );
        if (!success || result.length < 32) return false;
        return abi.decode(result, (bool));
    }
}
