/**
 * useCreateDrop — mutation hook to create a drop campaign via CelebrationsDrop.createDrop().
 *
 * Flow:
 *   1. Upload drop badge image to IPFS (Pinata)
 *   2. Build + upload LSP4 metadata JSON
 *   3. Call CelebrationsDrop.createDrop() on-chain
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAddresses } from "@/constants/addresses";
import { uploadJSONToIPFS, uploadFileToIPFS } from "@/lib/ipfs";
import type { Address, CelebrationType } from "@/types";
import { keccak256 } from "viem";
import type { WalletClient } from "viem";

const CREATE_DROP_ABI = [
  {
    name: "createDrop",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "cfg",
        type: "tuple",
        components: [
          { name: "host",               type: "address" },
          { name: "celebrationType",    type: "uint8" },
          { name: "year",               type: "uint16" },
          { name: "month",              type: "uint8" },
          { name: "day",                type: "uint8" },
          { name: "startAt",            type: "uint64" },
          { name: "endAt",              type: "uint64" },
          { name: "maxSupply",          type: "uint32" },
          { name: "requireFollowsHost", type: "bool" },
          { name: "minFollowers",       type: "uint32" },
          { name: "requiredLSP7",       type: "address[]" },
          { name: "requiredLSP8",       type: "address[]" },
          { name: "name",               type: "string" },
          { name: "imageIPFS",          type: "string" },
          { name: "metadataBytes",      type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "dropId", type: "bytes32" }],
  },
] as const;

export interface CreateDropParams {
  host: Address;
  celebrationType: CelebrationType;
  year: number;
  month: number;
  day: number;
  startAt?: Date;
  endAt?: Date;
  maxSupply?: number;
  requireFollowsHost?: boolean;
  minFollowers?: number;
  requiredLSP7?: Address[];
  requiredLSP8?: Address[];
  name: string;
  description?: string;
  imageIPFS?: string;
  /** Optional pre-generated image file (e.g. anniversary SVG, holiday badge).
   *  Uploaded to IPFS before the contract call; takes precedence over imageIPFS. */
  imageFile?: File;
}

async function buildDropMetadataBytes(params: CreateDropParams): Promise<{ metadataBytes: `0x${string}`; imageIPFS: string }> {
  // If a File is provided, upload it first and use its CID.
  // Only store the CID (not a data URI) — data URIs can't be used as IPFS urls.
  let imageIPFS = params.imageIPFS ?? "";
  if (params.imageFile) {
    try {
      const { url } = await uploadFileToIPFS(params.imageFile);
      if (url.startsWith("ipfs://")) {
        imageIPFS = url.slice(7); // store only the CID
      }
      // if fallback returned a data URI we intentionally leave imageIPFS empty
    } catch {
      console.warn("[useCreateDrop] imageFile upload failed — no image will be stored");
    }
  }

  // Build a minimal LSP4 metadata JSON for the drop badge
  const metadata = {
    LSP4Metadata: {
      name: params.name,
      description: params.description ?? `Drop badge: ${params.name}`,
      links: [],
      icon: [],
      images: imageIPFS
        ? [[{ width: 512, height: 512, url: `ipfs://${imageIPFS}`, verification: { method: "keccak256(bytes)", data: "0x" } }]]
        : [],
      assets: [],
      attributes: [
        { key: "CelebrationType", value: String(params.celebrationType), type: "string" },
        { key: "Year", value: String(params.year), type: "string" },
        { key: "Month", value: String(params.month), type: "string" },
        { key: "Day", value: String(params.day), type: "string" },
      ],
    },
  };

  try {
    const ipfsUrl = await uploadJSONToIPFS(metadata, `drop-badge-${params.name}-${params.year}`);

    // Only build JSONURL bytes when we have a real IPFS URL (not a data URI fallback)
    if (!ipfsUrl.startsWith("ipfs://")) {
      console.warn("[useCreateDrop] metadata IPFS upload unavailable — drop created without on-chain metadata");
      return { metadataBytes: "0x", imageIPFS };
    }

    // Encode as JSONURL: 0x6f357c6a + keccak256(utf8(content)) + utf8(ipfsUrl)
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(JSON.stringify(metadata));
    const hashHex = keccak256(contentBytes).slice(2); // strip 0x — gives 64 hex chars (32 bytes)

    const urlBytes = encoder.encode(ipfsUrl);
    const urlHex = Array.from(urlBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const metadataBytes = `0x6f357c6a${hashHex}${urlHex}` as `0x${string}`;

    return { metadataBytes, imageIPFS };
  } catch {
    // IPFS unavailable — create the drop without on-chain metadata.
    console.warn("[useCreateDrop] IPFS upload skipped — no proxy or JWT configured");
    return { metadataBytes: "0x", imageIPFS };
  }
}

export function useCreateDrop(
  walletClient: WalletClient | null,
  chainId: number
) {
  const queryClient = useQueryClient();
  const { celebrationsDrop } = getAddresses(chainId);

  return useMutation({
    mutationFn: async (params: CreateDropParams) => {
      if (!walletClient) throw new Error("Wallet not connected");

      const { metadataBytes, imageIPFS } = await buildDropMetadataBytes(params);

      const cfg = {
        host:               params.host,
        celebrationType:    params.celebrationType,
        year:               params.year,
        month:              params.month,
        day:                params.day,
        startAt:            params.startAt ? BigInt(Math.floor(params.startAt.getTime() / 1000)) : 0n,
        endAt:              params.endAt   ? BigInt(Math.floor(params.endAt.getTime() / 1000))   : 0n,
        maxSupply:          params.maxSupply ?? 0,
        requireFollowsHost: params.requireFollowsHost ?? false,
        minFollowers:       params.minFollowers ?? 0,
        requiredLSP7:       params.requiredLSP7 ?? [],
        requiredLSP8:       params.requiredLSP8 ?? [],
        name:               params.name,
        imageIPFS,
        metadataBytes:      metadataBytes as `0x${string}`,
      } as const;

      const hash = await walletClient.writeContract({
        address: celebrationsDrop,
        abi: CREATE_DROP_ABI,
        functionName: "createDrop",
        args: [cfg],
        account: params.host,
        chain: null,
      });

      return { txHash: hash };
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["drops", { host: params.host }] });
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    },
  });
}
