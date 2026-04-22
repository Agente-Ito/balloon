import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";
import type { Address, CelebrationBadge } from "@/app/types";
import { UINT8_TO_CELEBRATION_SLUG, CELEBRATION_SLUG_TO_BADGE_TYPE } from "@/app/types";

const PASSPORT_ABI = [
  {
    name: "hasPassport",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getStamps",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "celebrationType", type: "uint8" },
          { name: "year",            type: "uint16" },
          { name: "month",           type: "uint8" },
          { name: "day",             type: "uint8" },
          { name: "dropId",          type: "bytes32" },
          { name: "timestamp",       type: "uint64" },
        ],
      },
    ],
  },
  {
    name: "computeTokenId",
    type: "function",
    stateMutability: "pure",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
] as const;

export function useBadgeGallery(ownerAddress: Address | null, chainId: number) {
  const { celebrationPassport } = getAddresses(chainId);
  const publicClient = getPublicClient(chainId);
  const passportDeployed = celebrationPassport !== "0x0000000000000000000000000000000000000000";

  return useQuery({
    queryKey: ["badgeGallery", ownerAddress, chainId],
    queryFn: async (): Promise<CelebrationBadge[]> => {
      const hasPassport = await publicClient.readContract({
        address: celebrationPassport,
        abi: PASSPORT_ABI,
        functionName: "hasPassport",
        args: [ownerAddress!],
      }) as boolean;

      if (!hasPassport) return [];

      const rawStamps = await publicClient.readContract({
        address: celebrationPassport,
        abi: PASSPORT_ABI,
        functionName: "getStamps",
        args: [ownerAddress!],
      }) as readonly {
        celebrationType: number;
        year: number;
        month: number;
        day: number;
        dropId: `0x${string}`;
        timestamp: bigint;
      }[];

      return rawStamps.map((s, i): CelebrationBadge => {
        const typeSlug = UINT8_TO_CELEBRATION_SLUG[s.celebrationType] ?? UINT8_TO_CELEBRATION_SLUG[3];
        return {
          tokenId: `${ownerAddress}-stamp-${i}`,
          owner: ownerAddress!,
          badgeType: CELEBRATION_SLUG_TO_BADGE_TYPE[typeSlug],
          celebrationType: s.celebrationType as never,
          celebrationTypeSlug: typeSlug,
          celebrationId: `${typeSlug}:${ownerAddress}:${s.dropId}:${s.year}`,
          year: s.year,
          mintedAt: Number(s.timestamp),
          metadataCID: "",
          transferable: false, // passport stamps are always soulbound
        };
      });
    },
    enabled: !!ownerAddress && passportDeployed,
    staleTime: 120_000,
  });
}
