import { useQuery } from "@tanstack/react-query";
import { getUPCreationDate } from "@/lib/upCreationDate";
import type { Address } from "@/types";

/**
 * Fetches the block timestamp at which a Universal Profile was deployed.
 * Result is cached indefinitely — creation date never changes.
 * Uses binary search over block history (~23 RPC calls, one-time cost per UP).
 */
export function useUPCreationDate(upAddress: Address | null, chainId: number) {
  return useQuery({
    queryKey: ["upCreationDate", upAddress, chainId],
    queryFn:  () => getUPCreationDate(upAddress!, chainId),
    enabled:  !!upAddress,
    staleTime: Infinity,
    gcTime:    7 * 24 * 60 * 60 * 1000, // keep 7 days in cache
    retry: 2,
  });
}
