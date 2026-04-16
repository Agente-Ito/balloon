/**
 * useDrops — fetches drop campaigns from the indexer API.
 *
 * Supports:
 *   - host filter: drops created by a specific profile
 *   - active-only filter: drops with open window + available supply
 *   - date filter: drops scheduled on a specific calendar day
 *   - following filter: drops from profiles the viewer follows
 */
import { useQuery } from "@tanstack/react-query";
import type { IndexedDrop, Address } from "@/types";

const INDEXER_URL = import.meta.env.VITE_INDEXER_URL ?? "http://localhost:3001/api";

interface UseDropsOptions {
  host?: Address | null;
  activeOnly?: boolean;
  month?: number;
  day?: number;
  following?: Address[];
  enabled?: boolean;
}

export function useDrops(opts: UseDropsOptions = {}) {
  const params = new URLSearchParams();
  if (opts.host)               params.set("host", opts.host);
  if (opts.activeOnly)         params.set("active", "true");
  if (opts.month !== undefined) params.set("month", String(opts.month));
  if (opts.day !== undefined)   params.set("day", String(opts.day));
  if (opts.following?.length)   params.set("following", opts.following.join(","));

  const url = `${INDEXER_URL}/drops?${params.toString()}`;

  return useQuery<IndexedDrop[]>({
    queryKey: ["drops", opts],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Indexer error ${res.status}`);
      return res.json() as Promise<IndexedDrop[]>;
    },
    enabled: opts.enabled !== false,
    staleTime: 30_000,
  });
}

/** Fetch a single drop by its dropId */
export function useDropById(dropId: string | null) {
  return useQuery<IndexedDrop>({
    queryKey: ["drop", dropId],
    queryFn: async () => {
      const res = await fetch(`${INDEXER_URL}/drops/${dropId}`);
      if (!res.ok) throw new Error(`Indexer error ${res.status}`);
      return res.json() as Promise<IndexedDrop>;
    },
    enabled: !!dropId,
    staleTime: 30_000,
  });
}

/** Fetch the list of claimers for a drop */
export function useDropClaims(dropId: string | null) {
  return useQuery<{ dropId: string; claimer: Address; tokenId: string }[]>({
    queryKey: ["dropClaims", dropId],
    queryFn: async () => {
      const res = await fetch(`${INDEXER_URL}/drops/${dropId}/claims`);
      if (!res.ok) throw new Error(`Indexer error ${res.status}`);
      return res.json();
    },
    enabled: !!dropId,
    staleTime: 30_000,
  });
}
