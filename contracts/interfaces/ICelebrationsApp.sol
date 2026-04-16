// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Backwards-compatibility shim.
// The canonical interface files are now split into individual files:
//   - ICelebrationTypes.sol   (shared enum, events, errors)
//   - ICelebrationsBadge.sol  (badge interface)
//   - IGreetingCard.sol       (greeting card interface)
//   - ICelebrationsDelegate.sol
//   - ICelebrationRegistry.sol
//   - IFollowRegistry.sol
import {ICelebrationTypes} from "./ICelebrationTypes.sol";
import {ICelebrationsBadge} from "./ICelebrationsBadge.sol";
import {IGreetingCard} from "./IGreetingCard.sol";

// Re-export the shared types interface under the old name for any remaining consumers
// (e.g., existing off-chain code that imported ICelebrationsApp).
// New code should import from the individual interface files directly.
interface ICelebrationsApp is ICelebrationTypes {}
