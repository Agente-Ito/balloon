/**
 * Fetches an LSP3 Universal Profile name for a given address.
 * Uses viem to read the LSP3Profile JSONURL key, then fetches
 * the JSON from IPFS to extract the `name` field.
 *
 * The LSP3Profile key is keccak256("LSP3Profile"):
 * 0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5
 */
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

/** Decode a JSONURL bytes value and return the URL string. */
function decodeJsonUrl(hex: string): string | undefined {
  if (!hex || hex === "0x") return undefined;
  const body = hex.slice(2); // strip 0x
  // JSONURL prefix: 6f357c6a (4 bytes) + 32 bytes hash = 72 hex chars
  if (!body.startsWith("6f357c6a") || body.length <= 72) return undefined;
  const urlHex = body.slice(72);
  const bytes = urlHex.match(/../g)?.map((b) => parseInt(b, 16));
  if (!bytes?.length) return undefined;
  return new TextDecoder().decode(new Uint8Array(bytes));
}

async function fetchLSP3Name(address: string, chainId: number): Promise<string | undefined> {
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
  const json = await res.json() as { LSP3Profile?: { name?: string } };
  return json.LSP3Profile?.name ?? undefined;
}

export function useLSP3Name(address: Address | null, chainId: number) {
  return useQuery({
    queryKey: ["lsp3Name", address, chainId],
    queryFn: () => fetchLSP3Name(address!, chainId),
    enabled: !!address,
    staleTime: 5 * 60_000, // 5 min — names rarely change mid-session
    retry: 1,
  });
}
