import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";
import type { Address, Badge, BadgeMetadata } from "@/types";

const BADGE_ABI = [
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
  {
    name: "getData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "dataKey", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes" }],
  },
] as const;


export function useBadges(ownerAddress: Address | null, chainId: number) {
  const { celebrationsBadge } = getAddresses(chainId);
  const publicClient = getPublicClient(chainId);

  return useQuery({
    queryKey: ["badges", ownerAddress, chainId],
    queryFn: async (): Promise<Badge[]> => {
      // 1. Get all tokenIds owned by this address
      const tokenIds = await publicClient.readContract({
        address: celebrationsBadge,
        abi: BADGE_ABI,
        functionName: "tokenIdsOf",
        args: [ownerAddress!],
      }) as `0x${string}`[];

      if (tokenIds.length === 0) return [];

      // 2. For each token, fetch soulbound flag and metadata
      const badges = await Promise.all(
        tokenIds.map(async (tokenId): Promise<Badge> => {
          const [soulbound] = await Promise.all([
            publicClient.readContract({
              address: celebrationsBadge,
              abi: BADGE_ABI,
              functionName: "isSoulbound",
              args: [tokenId],
            }) as Promise<boolean>,
          ]);

          // Fetch metadata from IPFS via per-token LSP8 data
          // The frontend stores the IPFS URL in a predictable location
          // For now, return a placeholder — real metadata comes from events indexing
          const metadata: BadgeMetadata = {
            title: `Badge #${tokenId.slice(0, 8)}`,
            celebrationType: 0,
            year: new Date().getFullYear(),
            ownerProfile: ownerAddress!,
            image: "",
            timestamp: Date.now() / 1000,
          };

          return { tokenId, owner: ownerAddress!, metadata, soulbound };
        })
      );

      return badges;
    },
    enabled: !!ownerAddress && celebrationsBadge !== "0x0000000000000000000000000000000000000000",
    staleTime: 120_000,
  });
}
