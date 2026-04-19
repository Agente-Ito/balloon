import { useQuery } from "@tanstack/react-query";
import type { Address } from "@/types";

const INDEXER_URL = import.meta.env.VITE_INDEXER_URL ?? "http://localhost:3001/api";

export interface QuickGreeting {
  id: number;
  sender: Address;
  recipient: Address;
  reaction: "celebrate" | "hug" | "applause" | "party" | "sparkle";
  message: string | null;
  created_at: number;
}

export function useQuickGreetings(recipient: Address | null, limit = 20) {
  return useQuery<QuickGreeting[]>({
    queryKey: ["quickGreetings", recipient, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ recipient: recipient!, limit: String(limit) });
      const res = await fetch(`${INDEXER_URL}/quick-greetings?${params.toString()}`);
      if (!res.ok) throw new Error(`Indexer error ${res.status}`);
      return res.json() as Promise<QuickGreeting[]>;
    },
    enabled: !!recipient,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
