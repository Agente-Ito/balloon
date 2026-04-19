import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { LUKSO_TESTNET_RPC, LUKSO_MAINNET_RPC } from "@/constants/addresses";
import { resolveIPFSUrl } from "@/lib/ipfs";
import { decodeJsonUrl } from "@/lib/lsp2";
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

interface LSP3ProfileImage {
  url: string;
  width?: number;
  height?: number;
}

async function fetchLSP3AvatarUrl(address: string, chainId: number): Promise<string | undefined> {
  const client = makeClient(chainId);
  const raw = await client.readContract({
    address: address as `0x${string}`,
    abi: GET_DATA_ABI,
    functionName: "getData",
    args: [LSP3_PROFILE_KEY],
  });
  const url = decodeJsonUrl(raw as string);
  if (!url) return undefined;
  const resolved = resolveIPFSUrl(url);
  const res = await fetch(resolved);
  if (!res.ok) return undefined;
  const json = await res.json() as { LSP3Profile?: { profileImage?: LSP3ProfileImage[] } };
  const images = json.LSP3Profile?.profileImage;
  if (!images?.length) return undefined;
  // Prefer a mid-size image; fall back to first entry
  const preferred = images.find((img) => (img.width ?? 0) <= 400) ?? images[0];
  return resolveIPFSUrl(preferred.url);
}

export function useLSP3Avatar(address: Address | null, chainId: number | undefined) {
  return useQuery({
    queryKey: ["lsp3Avatar", address, chainId],
    queryFn: () => fetchLSP3AvatarUrl(address!, chainId!),
    enabled: !!address && !!chainId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
