import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/// Hardhat Ignition deployment module for the Celebrations dApp.
/// Deploy order:
///   1. CelebrationsBadge (needs delegate address → deploy with zero first, then update)
///   2. GreetingCard
///   3. CelebrationsDelegate (needs badge address)
///   4. Update CelebrationsBadge delegate to point at deployed CelebrationsDelegate
const CelebrationsModule = buildModule("CelebrationsModule", (m) => {
  // Step 1: Deploy badge contract with a zero delegate initially
  // We will update the delegate address after deploying CelebrationsDelegate.
  const badge = m.contract("CelebrationsBadge", [
    "0x0000000000000000000000000000000000000000",
  ]);

  // Step 2: Deploy greeting card (no external dependencies)
  const greetingCard = m.contract("GreetingCard", []);

  // Step 3: Deploy delegate with the badge contract address
  const delegate = m.contract("CelebrationsDelegate", [badge]);

  // Step 4: Update badge contract to recognise the delegate
  // This call is made by the contract owner (deployer).
  m.call(badge, "setDelegate", [delegate], { after: [delegate] });

  return { badge, greetingCard, delegate };
});

export default CelebrationsModule;
