/**
 * useBadgeGallery — fetches all badges owned by a given address.
 * Refactored from `src/hooks/useBadges.ts` to use app-level types and
 * the ContractsProvider for address resolution.
 */
import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";
import type { Address, CelebrationBadge } from "@/app/types";
import { UINT8_TO_CELEBRATION_SLUG, CELEBRATION_SLUG_TO_BADGE_TYPE } from "@/app/types";

const BADGE_READ_ABI = [
  {
    name: "tokenIdsOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenOwner", type: "address" }],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "isSoulbound",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export function useBadgeGallery(ownerAddress: Address | null, chainId: number) {
  const { celebrationsBadge } = getAddresses(chainId);
  const publicClient = getPublicClient(chainId);

  return useQuery({
    queryKey: ["badgeGallery", ownerAddress, chainId],
    queryFn: async (): Promise<CelebrationBadge[]> => {
      const tokenIds = (await publicClient.readContract({
        address: celebrationsBadge,
        abi: BADGE_READ_ABI,
        functionName: "tokenIdsOf",
        args: [ownerAddress!],
      })) as `0x${string}`[];

      if (tokenIds.length === 0) return [];

      return Promise.all(
        tokenIds.map(async (tokenId): Promise<CelebrationBadge> => {
          const soulbound = (await publicClient.readContract({
            address: celebrationsBadge,
            abi: BADGE_READ_ABI,
            functionName: "isSoulbound",
            args: [tokenId],
          })) as boolean;

          // Metadata enrichment happens off-chain (indexer / IPFS decode).
          // Return a typed stub so the gallery can render immediately.
          const typeSlug = UINT8_TO_CELEBRATION_SLUG[3]; // fallback: custom_event
          return {
            tokenId,
            owner: ownerAddress!,
            badgeType: CELEBRATION_SLUG_TO_BADGE_TYPE[typeSlug],
            celebrationType: 3 as never, // CelebrationType.CustomEvent
            celebrationTypeSlug: typeSlug,
            celebrationId: `custom:${ownerAddress}:unknown:${new Date().getFullYear()}`,
            year: new Date().getFullYear(),
            mintedAt: 0,
            metadataCID: "",
            transferable: !soulbound,
          };
        })
      );
    },
    enabled:
      !!ownerAddress &&
      celebrationsBadge !== "0x0000000000000000000000000000000000000000",
    staleTime: 120_000,
  });
}
