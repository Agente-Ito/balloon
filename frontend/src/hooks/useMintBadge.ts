import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildAndUploadBadgeMetadata, encodeMetadataBytes } from "@/lib/lsp4Builder";
import { getAddresses } from "@/constants/addresses";
import type { Address, CelebrationType as CT } from "@/types";
import type { WalletClient, Chain } from "viem";

const BADGE_ABI = [
  {
    name: "mintBadge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "celebrationType", type: "uint8" },
      { name: "year", type: "uint16" },
      { name: "soulbound", type: "bool" },
      { name: "metadataBytes", type: "bytes" },
      { name: "force", type: "bool" },
    ],
    outputs: [{ name: "tokenId", type: "bytes32" }],
  },
  {
    name: "badgeExists",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "celebrationType", type: "uint8" },
      { name: "year", type: "uint16" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface MintBadgeParams {
  to: Address;
  celebrationType: CT;
  year: number;
  soulbound: boolean;
  imageUrl?: string;
  imageHash?: string;
}

export function useMintBadge(
  walletClient: WalletClient | null,
  chainId: number
) {
  const queryClient = useQueryClient();
  const { celebrationsBadge } = getAddresses(chainId);

  return useMutation({
    mutationFn: async (params: MintBadgeParams) => {
      if (!walletClient) throw new Error("Wallet not connected");

      const [account] = await walletClient.getAddresses();

      // 1. Build and upload LSP4 metadata to IPFS
      const { ipfsUrl, contentHash } = await buildAndUploadBadgeMetadata({
        ownerAddress: params.to,
        celebrationType: params.celebrationType,
        year: params.year,
        imageUrl: params.imageUrl,
        imageHash: params.imageHash,
      });

      // 2. Encode metadata bytes for the contract
      const metadataBytes = encodeMetadataBytes(ipfsUrl, contentHash);

      // 3. Call mintBadge on the contract
      const hash = await walletClient.writeContract({
        address: celebrationsBadge,
        abi: BADGE_ABI,
        functionName: "mintBadge",
        // force=false: in production recipients are Universal Profiles (not plain EOAs)
        args: [params.to, params.celebrationType, params.year, params.soulbound, metadataBytes, false],
        account,
        chain: walletClient.chain as Chain,
      });

      return { txHash: hash, ipfsUrl };
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["badges", params.to] });
    },
  });
}
