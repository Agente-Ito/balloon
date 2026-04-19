import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { LUKSO_TESTNET_RPC, LUKSO_MAINNET_RPC } from "@/constants/addresses";
import { resolveIPFSUrl } from "@/lib/ipfs";
import type { Address } from "@/types";

const LSP3_PROFILE_KEY =
  "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5" as const;

const GET_DATA_ABI = [
  {
    name: "getData",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "dataKey",   type: "bytes32" }],
    outputs: [{ name: "dataValue", type: "bytes"   }],
  },
] as const;

function makeClient(chainId: number) {
  const rpc = chainId === 42 ? LUKSO_MAINNET_RPC : LUKSO_TESTNET_RPC;
  return createPublicClient({ transport: http(rpc) });
}

function decodeJsonUrl(hex: string): string | undefined {
  if (!hex || hex === "0x") return undefined;
  const body = hex.slice(2);
  if (!body.startsWith("6f357c6a") || body.length <= 72) return undefined;
  const urlHex = body.slice(72);
  const bytes = urlHex.match(/../g)?.map((b) => parseInt(b, 16));
  if (!bytes?.length) return undefined;
  return new TextDecoder().decode(new Uint8Array(bytes));
}

interface LSP3ProfileImage {
  url: string;
  width?: number;
  height?: number;
}

export interface LSP3ProfileData {
  name: string | undefined;
  imageUrl: string | undefined;
}

async function fetchLSP3Profile(address: string, chainId: number): Promise<LSP3ProfileData> {
  const client = makeClient(chainId);
  const raw = await client.readContract({
    address: address as `0x${string}`,
    abi: GET_DATA_ABI,
    functionName: "getData",
    args: [LSP3_PROFILE_KEY],
  });

  const url = decodeJsonUrl(raw as string);
  if (!url) return { name: undefined, imageUrl: undefined };

  const resolved = resolveIPFSUrl(url);
  const res = await fetch(resolved);
  if (!res.ok) return { name: undefined, imageUrl: undefined };

  const json = await res.json() as {
    LSP3Profile?: {
      name?: string;
      profileImage?: LSP3ProfileImage[];
    };
  };

  const profile = json.LSP3Profile;
  const name = profile?.name?.trim() || undefined;

  const images = profile?.profileImage;
  const preferred = images?.find((img) => (img.width ?? 0) <= 400) ?? images?.[0];
  const imageUrl = preferred ? resolveIPFSUrl(preferred.url) : undefined;

  return { name, imageUrl };
}

export function useLSP3Profile(address: Address | null, chainId: number | undefined) {
  return useQuery({
    queryKey: ["lsp3Profile", address, chainId],
    queryFn: () => fetchLSP3Profile(address!, chainId!),
    enabled: !!address && !!chainId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
