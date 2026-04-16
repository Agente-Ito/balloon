// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ICelebrationsBadge} from "../interfaces/ICelebrationsBadge.sol";
import {ICelebrationsDelegate} from "../interfaces/ICelebrationsDelegate.sol";
import {ProfileUtils} from "../libraries/ProfileUtils.sol";
import {ERC725Keys} from "../libraries/ERC725Keys.sol";
import {CelebrationEligibility} from "./CelebrationEligibility.sol";
import {CelebrationEvents} from "./CelebrationEvents.sol";

/// @title CelebrationsDelegate
/// @notice LSP1 Universal Receiver Delegate (URD) for the Celebrations dApp.
///
/// This contract is registered on a user's Universal Profile as their LSP1 delegate.
/// When the UP receives tokens or other notifications, the UP calls this delegate's
/// `universalReceiverDelegate()` function. The delegate can then:
///   1. Detect inbound greeting cards and emit a `CelebrationGiftReceived` event.
///   2. Check if today matches the UP's stored birthday and auto-mint a badge.
///   3. Detect inbound LSP7/LSP8 gift tokens during an active celebration.
///
/// IMPORTANT: In the delegate context, `msg.sender` is always the UP itself, NOT the
/// original transaction sender.
///
/// ERC725Y keys read from the UP:
///   - app:celebrations:birthday         → "YYYY-MM-DD" string
///   - app:celebrations:profileCreatedAt → unix timestamp (uint256)
///   - app:celebrations:settings         → IPFS CID JSON (includes autoMintBadge flag)
contract CelebrationsDelegate is
    ICelebrationsDelegate,
    CelebrationEligibility,
    CelebrationEvents
{
    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    /// @notice The CelebrationsBadge contract address
    address public immutable badgeContract;

    /// @notice Auto-mint cooldown per UP: tracks last auto-mint year to prevent replays
    mapping(address => mapping(uint8 => uint256)) public lastAutoMintYear;

    // ─────────────────────────────────────────────────────────────────────
    // ERC165 interface IDs
    // ─────────────────────────────────────────────────────────────────────

    bytes4 private constant _LSP1_DELEGATE_INTERFACE_ID = 0xa245bbda;
    bytes4 private constant _ERC165_INTERFACE_ID        = 0x01ffc9a7;

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor(address _badgeContract) {
        badgeContract = _badgeContract;
    }

    // ─────────────────────────────────────────────────────────────────────
    // LSP1 Interface
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Called by the Universal Profile when it receives any notification.
    /// @param notifier  The address that triggered the notification (e.g., token contract)
    /// @param typeId    The notification type identifier
    /// @param data      Additional ABI-encoded data (depends on typeId)
    /// @return result   Empty bytes (no return value needed for this delegate)
    function universalReceiverDelegate(
        address notifier,
        uint256, /* value */
        bytes32 typeId,
        bytes memory data
    ) external returns (bytes memory result) {
        address universalProfile = msg.sender;

        if (typeId == TYPEID_LSP8_TOKENS_RECIPIENT) {
            _handleLSP8Received(universalProfile, notifier, data);
        } else if (typeId == TYPEID_LSP7_TOKENS_RECIPIENT) {
            _handleLSP7Received(universalProfile, notifier, data);
        }

        _checkAndEmitCelebrations(universalProfile);

        return "";
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: celebration detection
    // ─────────────────────────────────────────────────────────────────────

    /// @dev Check if today is the UP's birthday or UP anniversary and emit events / auto-mint.
    function _checkAndEmitCelebrations(address profile) internal {
        // --- Birthday check ---
        bytes memory birthdayData = ProfileUtils.safeGetData(profile, ERC725Keys.KEY_BIRTHDAY);
        (bool isBirthday, uint16 birthYear) = _isBirthdayToday(profile, birthdayData);

        if (isBirthday) {
            uint8 birthdayType = uint8(CelebrationType.Birthday);

            if (lastAutoMintYear[profile][birthdayType] < birthYear) {
                lastAutoMintYear[profile][birthdayType] = birthYear;
                emit BirthdayDetected(profile, birthYear);

                if (badgeContract != address(0)) {
                    try ICelebrationsBadge(badgeContract).mintBadge(
                        profile,
                        CelebrationType.Birthday,
                        birthYear,
                        true,  // soulbound
                        "",    // metadata set separately by profile owner
                        false  // force=false: profile is always a UP in this context
                    ) {} catch {}
                }
            }
        }

        // --- UP anniversary check ---
        bytes memory createdAtData = ProfileUtils.safeGetData(profile, ERC725Keys.KEY_PROFILE_CREATED_AT);
        (bool isAnniversary, uint16 annivYear, uint256 yearsOld) = _isAnniversaryToday(createdAtData);

        if (isAnniversary) {
            uint8 annivType = uint8(CelebrationType.UPAnniversary);

            if (lastAutoMintYear[profile][annivType] < annivYear) {
                lastAutoMintYear[profile][annivType] = annivYear;
                emit UPAnniversaryDetected(profile, annivYear, yearsOld);

                if (badgeContract != address(0)) {
                    try ICelebrationsBadge(badgeContract).mintBadge(
                        profile,
                        CelebrationType.UPAnniversary,
                        annivYear,
                        true,  // soulbound
                        "",    // metadata set separately by profile owner
                        false  // force=false: profile is always a UP in this context
                    ) {} catch {}
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // ERC165 support
    // ─────────────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == _LSP1_DELEGATE_INTERFACE_ID
            || interfaceId == _ERC165_INTERFACE_ID;
    }
}
