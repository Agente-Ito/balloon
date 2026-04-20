/**
 * useClaimDrop — mutation hook to claim a drop badge via CelebrationsDrop.claim().
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAddresses } from "@/constants/addresses";
import { useAppStore } from "@/store/useAppStore";
import type { Address } from "@/types";
import type { WalletClient } from "viem";

const CLAIM_ABI = [
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "dropId", type: "bytes32" },
      { name: "force",  type: "bool" },
    ],
    outputs: [],
  },
] as const;

export function useClaimDrop(
  walletClient: WalletClient | null,
  chainId: number
) {
  const queryClient = useQueryClient();
  const { triggerBurst } = useAppStore();
  const { celebrationsDrop } = getAddresses(chainId);

  return useMutation({
    mutationFn: async ({
      dropId,
      claimer,
    }: {
      dropId: string;
      claimer: Address;
    }) => {
      if (!walletClient) throw new Error("Wallet not connected");

      const hash = await walletClient.writeContract({
        address: celebrationsDrop,
        abi: CLAIM_ABI,
        functionName: "claim",
        // force=false: recipients are Universal Profiles in production
        args: [dropId as `0x${string}`, false],
        account: claimer,
        chain: null,
      });

      return { txHash: hash };
    },
    onSuccess: (_, vars) => {
      triggerBurst("epic");
      queryClient.invalidateQueries({ queryKey: ["dropEligibility", vars.dropId] });
      queryClient.invalidateQueries({ queryKey: ["dropClaims", vars.dropId] });
      queryClient.invalidateQueries({ queryKey: ["drop", vars.dropId] });
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    },
  });
}
