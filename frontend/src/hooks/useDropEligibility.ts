/**
 * useDropEligibility — view-only on-chain check for drop claim eligibility.
 * Calls checkEligibility() on CelebrationsDrop — no gas, no wallet needed.
 */
import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";
import type { Address } from "@/types";

const CHECK_ELIGIBILITY_ABI = [
  {
    name: "checkEligibility",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "dropId", type: "bytes32" },
      { name: "claimer", type: "address" },
    ],
    outputs: [
      { name: "ok", type: "bool" },
      { name: "reason", type: "string" },
    ],
  },
] as const;

export function useDropEligibility(
  dropId: string | null,
  claimer: Address | null,
  chainId: number
) {
  const { celebrationsDrop } = getAddresses(chainId);
  const publicClient = getPublicClient(chainId);
  const isDeployed = celebrationsDrop !== "0x0000000000000000000000000000000000000000";

  return useQuery<{ ok: boolean; reason: string }>({
    queryKey: ["dropEligibility", dropId, claimer, chainId],
    queryFn: async () => {
      const [ok, reason] = (await publicClient.readContract({
        address: celebrationsDrop,
        abi: CHECK_ELIGIBILITY_ABI,
        functionName: "checkEligibility",
        args: [dropId as `0x${string}`, claimer!],
      })) as [boolean, string];
      return { ok, reason };
    },
    enabled: !!dropId && !!claimer && isDeployed,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
