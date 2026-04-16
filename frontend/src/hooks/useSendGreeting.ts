import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildAndUploadGreetingCardMetadata, encodeMetadataBytes } from "@/lib/lsp4Builder";
import { getAddresses } from "@/constants/addresses";
import type { Address, CelebrationType as CT } from "@/types";
import type { WalletClient, Chain } from "viem";

const GREETING_CARD_ABI = [
  {
    name: "mintCard",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "celebrationType", type: "uint8" },
      { name: "metadataBytes", type: "bytes" },
      { name: "force", type: "bool" },
    ],
    outputs: [{ name: "tokenId", type: "bytes32" }],
  },
] as const;

interface SendGreetingParams {
  to: Address;
  celebrationType: CT;
  message: string;
  imageUrl?: string;
  imageHash?: string;
}

export function useSendGreeting(
  walletClient: WalletClient | null,
  senderAddress: Address | null,
  chainId: number
) {
  const queryClient = useQueryClient();
  const { greetingCard } = getAddresses(chainId);

  return useMutation({
    mutationFn: async (params: SendGreetingParams) => {
      if (!walletClient || !senderAddress) throw new Error("Wallet not connected");

      const [account] = await walletClient.getAddresses();
      const year = new Date().getFullYear();

      // 1. Build and upload greeting card metadata
      const { ipfsUrl, contentHash } = await buildAndUploadGreetingCardMetadata({
        fromAddress: senderAddress,
        toAddress: params.to,
        celebrationType: params.celebrationType,
        message: params.message,
        year,
        imageUrl: params.imageUrl,
        imageHash: params.imageHash,
      });

      // 2. Encode metadata bytes
      const metadataBytes = encodeMetadataBytes(ipfsUrl, contentHash);

      // 3. Call mintCard
      const hash = await walletClient.writeContract({
        address: greetingCard,
        abi: GREETING_CARD_ABI,
        functionName: "mintCard",
        // force=false: in production recipients are Universal Profiles (not plain EOAs)
        args: [params.to, params.celebrationType, metadataBytes, false],
        account,
        chain: walletClient.chain as Chain,
      });

      return { txHash: hash, ipfsUrl };
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["greetingCards", params.to] });
      queryClient.invalidateQueries({ queryKey: ["canSendGreeting", senderAddress, params.to] });
    },
  });
}
