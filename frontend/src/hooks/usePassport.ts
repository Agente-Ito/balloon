import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";
import type { Address, Passport, Stamp } from "@/types";
import { CelebrationType } from "@/types";

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
  {
    name: "stampCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function usePassport(ownerAddress: Address | null, chainId: number) {
  const { celebrationPassport } = getAddresses(chainId);
  const publicClient = getPublicClient(chainId);
  const passportDeployed = celebrationPassport !== "0x0000000000000000000000000000000000000000";

  return useQuery({
    queryKey: ["passport", ownerAddress, chainId],
    queryFn: async (): Promise<Passport | null> => {
      const hasPassport = await publicClient.readContract({
        address: celebrationPassport,
        abi: PASSPORT_ABI,
        functionName: "hasPassport",
        args: [ownerAddress!],
      }) as boolean;

      if (!hasPassport) return null;

      const [rawStamps, tokenId] = await Promise.all([
        publicClient.readContract({
          address: celebrationPassport,
          abi: PASSPORT_ABI,
          functionName: "getStamps",
          args: [ownerAddress!],
        }) as Promise<readonly {
          celebrationType: number;
          year: number;
          month: number;
          day: number;
          dropId: `0x${string}`;
          timestamp: bigint;
        }[]>,
        publicClient.readContract({
          address: celebrationPassport,
          abi: PASSPORT_ABI,
          functionName: "computeTokenId",
          args: [ownerAddress!],
        }) as Promise<`0x${string}`>,
      ]);

      const stamps: Stamp[] = rawStamps.map((s) => ({
        celebrationType: s.celebrationType as CelebrationType,
        year:    s.year,
        month:   s.month,
        day:     s.day,
        dropId:  s.dropId,
        timestamp: Number(s.timestamp),
      }));

      return { tokenId, owner: ownerAddress!, stamps };
    },
    enabled: !!ownerAddress && passportDeployed,
    staleTime: 60_000,
  });
}
