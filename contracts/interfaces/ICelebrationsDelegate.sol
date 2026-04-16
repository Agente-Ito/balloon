// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationTypes} from "./ICelebrationTypes.sol";

/// @title ICelebrationsDelegate
/// @notice Interface for the CelebrationsDelegate LSP1 Universal Receiver Delegate
interface ICelebrationsDelegate is ICelebrationTypes {
    /// @notice Called by the Universal Profile when it receives any notification
    /// @param notifier  The address that triggered the notification
    /// @param value     The value sent with the notification (usually 0)
    /// @param typeId    The notification type identifier
    /// @param data      Additional ABI-encoded data (depends on typeId)
    /// @return result   Empty bytes (no return value needed)
    function universalReceiverDelegate(
        address notifier,
        uint256 value,
        bytes32 typeId,
        bytes memory data
    ) external returns (bytes memory result);

    /// @notice Check ERC165 interface support
    function supportsInterface(bytes4 interfaceId) external pure returns (bool);
}
