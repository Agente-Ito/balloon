import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";
import { resolveIPFSUrl } from "@/lib/ipfs";
import type { Address, GreetingCard } from "@/types";
import { hexToString, isAddress } from "viem";

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
  {
    name: "getDataForTokenId",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "bytes32" },
      { name: "dataKey", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
] as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const LSP4_METADATA_KEY =
  "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e" as const;

type LSP4MetadataAttribute = {
  key?: string;
  value?: string | number | boolean;
};

type LSP4MetadataJson = {
  LSP4Metadata?: {
    name?: string;
    description?: string;
    icon?: Array<{ url?: string }>;
    attributes?: LSP4MetadataAttribute[];
  };
};

function parseMetadataUrl(data: `0x${string}`): string | null {
  if (!data || data === "0x") return null;

  // Standard LSP2 JSONURL encoding: 4-byte prefix + 32-byte hash + UTF-8 URL
  const body = data.slice(2);
  if (body.startsWith("6f357c6a") && body.length > 72) {
    try {
      const urlHex = `0x${body.slice(72)}` as `0x${string}`;
      const url = hexToString(urlHex);
      return url || null;
    } catch {
      return null;
    }
  }

  // App encoding used by current app: 32-byte hash + UTF-8 URL
  if (body.length > 64) {
    try {
      const urlHex = `0x${body.slice(64)}` as `0x${string}`;
      const url = hexToString(urlHex);
      return url || null;
    } catch {
      return null;
    }
  }

  return null;
}

function getAttr(attributes: LSP4MetadataAttribute[] | undefined, key: string): string | undefined {
  if (!attributes) return undefined;
  const found = attributes.find((a) => a.key === key);
  if (!found || found.value == null) return undefined;
  return String(found.value);
}

async function fetchCardMetadataFromToken(
  publicClient: ReturnType<typeof getPublicClient>,
  greetingCard: Address,
  tokenId: `0x${string}`,
  fallbackRecipient: Address
): Promise<GreetingCard> {
  const raw = await publicClient.readContract({
    address: greetingCard,
    abi: GREETING_CARD_ABI,
    functionName: "getDataForTokenId",
    args: [tokenId, LSP4_METADATA_KEY],
  }) as `0x${string}`;

  const metadataUrl = parseMetadataUrl(raw);
  if (!metadataUrl) {
    return {
      tokenId,
      metadata: {
        title: "Greeting Card",
        from: ZERO_ADDRESS,
        to: fallbackRecipient,
        celebration: 0,
        message: "",
        year: new Date().getFullYear(),
        timestamp: 0,
        image: "",
      },
    };
  }

  try {
    const res = await fetch(resolveIPFSUrl(metadataUrl));
    if (!res.ok) throw new Error("metadata fetch failed");
    const json = (await res.json()) as LSP4MetadataJson;
    const lsp4 = json.LSP4Metadata;
    const attrs = lsp4?.attributes;

    const fromAttr = getAttr(attrs, "from");
    const toAttr = getAttr(attrs, "to");
    const msgAttr = getAttr(attrs, "message");
    const celebrationAttr = Number(getAttr(attrs, "celebrationTypeId") ?? 0);
    const yearAttr = Number(getAttr(attrs, "year") ?? new Date().getFullYear());

    const from = fromAttr && isAddress(fromAttr) ? (fromAttr as Address) : ZERO_ADDRESS;
    const to = toAttr && isAddress(toAttr) ? (toAttr as Address) : fallbackRecipient;

    return {
      tokenId,
      metadata: {
        title: lsp4?.name ?? "Greeting Card",
        from,
        to,
        celebration: Number.isFinite(celebrationAttr) ? celebrationAttr : 0,
        message: msgAttr ?? lsp4?.description ?? "",
        year: Number.isFinite(yearAttr) ? yearAttr : new Date().getFullYear(),
        timestamp: 0,
        image: lsp4?.icon?.[0]?.url ?? "",
      },
    };
  } catch {
    return {
      tokenId,
      metadata: {
        title: "Greeting Card",
        from: ZERO_ADDRESS,
        to: fallbackRecipient,
        celebration: 0,
        message: "",
        year: new Date().getFullYear(),
        timestamp: 0,
        image: "",
      },
    };
  }
}

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

      const cards = await Promise.all(
        tokenIds.map((tokenId) =>
          fetchCardMetadataFromToken(publicClient, greetingCard, tokenId, recipientAddress!)
        )
      );

      return cards;
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
