// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {GlobalFestivities} from "./GlobalFestivities.sol";
import {ValidationUtils} from "../libraries/ValidationUtils.sol";

/// @title CelebrationRegistry
/// @notice On-chain registry of global festivities.
///         Inherits the pre-populated list from GlobalFestivities and allows
///         the contract owner to add custom entries (e.g., LUKSO-specific dates).
contract CelebrationRegistry is GlobalFestivities {
    address public owner;

    event FestivityAdded(uint8 indexed month, uint8 indexed day, string name);

    error Unauthorized();

    constructor() GlobalFestivities() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    /// @notice Add a new globally-recognised festivity (only owner)
    function addFestivity(
        uint8 month,
        uint8 day,
        string calldata name,
        CelebrationType celebrationType
    ) external onlyOwner {
        ValidationUtils.requireValidMonthDay(month, day);
        _festivities.push(Festivity(month, day, name, celebrationType));
        emit FestivityAdded(month, day, name);
    }

    /// @notice Transfer registry ownership
    function transferOwnership(address newOwner) external onlyOwner {
        ValidationUtils.requireNonZero(newOwner, "CelebrationRegistry");
        owner = newOwner;
    }
}
