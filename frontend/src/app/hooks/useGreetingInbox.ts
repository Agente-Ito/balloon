/**
 * useGreetingInbox — fetches greeting cards received by a given address.
 * Refactored from `src/hooks/useGreetingCards.ts`.
 */
import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";
import type { Address, GreetingCard } from "@/app/types";
import { UINT8_TO_CELEBRATION_SLUG, CELEBRATION_SLUG_TO_GREETING_TYPE } from "@/app/types";

const CARD_READ_ABI = [
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

const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

export function useGreetingInbox(recipientAddress: Address | null, chainId: number) {
  const { greetingCard } = getAddresses(chainId);
  const publicClient = getPublicClient(chainId);

  return useQuery({
    queryKey: ["greetingInbox", recipientAddress, chainId],
    queryFn: async (): Promise<GreetingCard[]> => {
      const tokenIds = (await publicClient.readContract({
        address: greetingCard,
        abi: CARD_READ_ABI,
        functionName: "cardsOf",
        args: [recipientAddress!],
      })) as `0x${string}`[];

      // Return typed stubs; full metadata comes from the indexer
      const typeSlug = UINT8_TO_CELEBRATION_SLUG[3]; // fallback: custom_event
      return tokenIds.map((tokenId): GreetingCard => ({
        tokenId,
        fromProfile: ZERO_ADDRESS,
        toProfile: recipientAddress!,
        greetingType: CELEBRATION_SLUG_TO_GREETING_TYPE[typeSlug],
        celebrationType: 3 as never, // CelebrationType.CustomEvent
        celebrationTypeSlug: typeSlug,
        celebrationId: `custom:${recipientAddress}:inbox:${new Date().getFullYear()}`,
        message: "",
        metadataCID: "",
        mintedAt: 0,
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
      const nextAllowedAt = (await publicClient.readContract({
        address: greetingCard,
        abi: CARD_READ_ABI,
        functionName: "nextAllowedAt",
        args: [senderAddress!, recipientAddress!],
      })) as bigint;

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
