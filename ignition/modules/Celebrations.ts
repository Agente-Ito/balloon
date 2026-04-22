import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/// Hardhat Ignition deployment module for the Celebrations dApp.
/// Deploy order:
///   1. CelebrationPassport (standalone, no deps)
///   2. GreetingCard (no deps)
///   3. CelebrationsDelegate (needs passport address)
///   4. CelebrationsDrop (needs passport + followRegistry)
///   5. Authorize drop + delegate to add stamps on the passport
const CelebrationsModule = buildModule("CelebrationsModule", (m) => {
  const followRegistry = m.getParameter("followRegistry");

  // Step 1: Deploy the passport (replaces CelebrationsBadge + DropBadge)
  const passport = m.contract("CelebrationPassport", []);

  // Step 2: Deploy greeting card (no external dependencies)
  const greetingCard = m.contract("GreetingCard", []);

  // Step 3: Deploy delegate with the passport address
  const delegate = m.contract("CelebrationsDelegate", [passport]);

  // Step 4: Deploy drop hub with passport + follow registry
  const drop = m.contract("CelebrationsDrop", [passport, followRegistry]);

  // Step 5: Authorize drop and delegate to call addStamp on the passport
  m.call(passport, "setAuthorized", [delegate, true], { id: "AuthorizeDelegate", after: [delegate] });
  m.call(passport, "setAuthorized", [drop,     true], { id: "AuthorizeDrop",     after: [drop]     });

  return { passport, greetingCard, delegate, drop };
});

export default CelebrationsModule;
