/**
 * useSocialCalendar — fetches birthday/anniversary dates and active drops
 * from profiles that the viewer follows, via the indexer /social-calendar endpoint.
 *
 * The result feeds the CalendarView overlay showing friends' celebrations.
 */
import { useQuery } from "@tanstack/react-query";
import type { Address, SocialProfile, IndexedDrop } from "@/types";

const INDEXER_URL = import.meta.env.VITE_INDEXER_URL ?? "http://localhost:3001/api";

interface SocialCalendarData {
  /** Followed profiles with their birthday/anniversary dates */
  profiles: SocialProfile[];
  /** Active drops from followed profiles */
  drops: IndexedDrop[];
}

export function useSocialCalendar(viewer: Address | null, month?: number) {
  const params = new URLSearchParams();
  if (viewer) params.set("viewer", viewer);
  if (month !== undefined) params.set("month", String(month));

  return useQuery<SocialCalendarData>({
    queryKey: ["socialCalendar", viewer, month],
    queryFn: async () => {
      const res = await fetch(`${INDEXER_URL}/social-calendar?${params.toString()}`);
      if (!res.ok) throw new Error(`Indexer error ${res.status}`);
      return res.json() as Promise<SocialCalendarData>;
    },
    enabled: !!viewer,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
