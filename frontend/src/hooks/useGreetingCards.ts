import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";
import type { Address, GreetingCard } from "@/types";

const GREETING_CARD_ABI = [
  {
    name: "cardsOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "recipient", type: "address" }],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "nextAllowedAt",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function useReceivedGreetingCards(recipientAddress: Address | null, chainId: number) {
  const { greetingCard } = getAddresses(chainId);
  const publicClient = getPublicClient(chainId);

  return useQuery({
    queryKey: ["greetingCards", recipientAddress, chainId],
    queryFn: async (): Promise<GreetingCard[]> => {
      const tokenIds = await publicClient.readContract({
        address: greetingCard,
        abi: GREETING_CARD_ABI,
        functionName: "cardsOf",
        args: [recipientAddress!],
      }) as `0x${string}`[];

      // Return card stubs — metadata would be indexed from IPFS off-chain
      return tokenIds.map((tokenId) => ({
        tokenId,
        metadata: {
          title: "Greeting Card",
          from: "0x0000000000000000000000000000000000000000" as Address,
          to: recipientAddress!,
          celebration: 0,
          message: "",
          year: new Date().getFullYear(),
          timestamp: 0,
          image: "",
        },
      }));
    },
    enabled:
      !!recipientAddress &&
      greetingCard !== "0x0000000000000000000000000000000000000000",
    staleTime: 60_000,
  });
}

export function useCanSendGreeting(
  senderAddress: Address | null,
  recipientAddress: Address | null,
  chainId: number
) {
  const { greetingCard } = getAddresses(chainId);
  const publicClient = getPublicClient(chainId);

  return useQuery({
    queryKey: ["canSendGreeting", senderAddress, recipientAddress, chainId],
    queryFn: async () => {
      const nextAllowedAt = await publicClient.readContract({
        address: greetingCard,
        abi: GREETING_CARD_ABI,
        functionName: "nextAllowedAt",
        args: [senderAddress!, recipientAddress!],
      }) as bigint;

      const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
      return {
        canSend: nowSeconds >= nextAllowedAt,
        nextAllowedAt: Number(nextAllowedAt),
      };
    },
    enabled: !!senderAddress && !!recipientAddress,
    staleTime: 30_000,
  });
}
