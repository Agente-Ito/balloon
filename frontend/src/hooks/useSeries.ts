/**
 * Hooks for community art series — listing, submissions, and voting.
 * Talks to the indexer API: /api/series/*
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DropSeries, SeriesSubmission, Address } from "@/types";

const API = (import.meta.env.VITE_INDEXER_URL as string | undefined)?.replace(/\/$/, "") ?? "";

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Query hooks ───────────────────────────────────────────────────────────────

/** All series (open + closed) */
export function useAllSeries() {
  return useQuery<DropSeries[]>({
    queryKey: ["series"],
    queryFn: () => apiFetch<DropSeries[]>("/series"),
    staleTime: 2 * 60_000,
  });
}

/** Series detail */
export function useSeriesById(id: string | null) {
  return useQuery<DropSeries>({
    queryKey: ["series", id],
    queryFn: () => apiFetch<DropSeries>(`/series/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/** Submissions for a series, with vote counts and whether the viewer voted */
export function useSeriesSubmissions(seriesId: string | null, viewer?: Address | null) {
  return useQuery<SeriesSubmission[]>({
    queryKey: ["series-submissions", seriesId, viewer ?? "anon"],
    queryFn: () => {
      const qs = viewer ? `?viewer=${viewer}` : "";
      return apiFetch<SeriesSubmission[]>(`/series/${seriesId}/submissions${qs}`);
    },
    enabled: !!seriesId,
    staleTime: 30_000,
    refetchInterval: 60_000, // refresh votes every minute
  });
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

/** Cast or switch a vote for a submission */
export function useCastVote(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, voter }: { submissionId: number; voter: Address }) => {
      return apiFetch<{ ok: boolean; submissions: SeriesSubmission[] }>(`/series/${seriesId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, voter }),
      });
    },
    onSuccess: (data, { voter }) => {
      // Update the cache directly with the fresh submission list returned by the API
      queryClient.setQueriesData<SeriesSubmission[]>(
        { queryKey: ["series-submissions", seriesId] },
        () => data.submissions,
      );
      // Also invalidate the viewer-specific version
      queryClient.invalidateQueries({ queryKey: ["series-submissions", seriesId, voter] });
    },
  });
}

/** Remove the viewer's vote */
export function useRemoveVote(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (voter: Address) => {
      return apiFetch<{ ok: boolean }>(`/series/${seriesId}/vote`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voter }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series-submissions", seriesId] });
    },
  });
}

/** Submit artwork to a series */
export function useSubmitArt(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      artist,
      imageIPFS,
      message,
    }: {
      artist: Address;
      imageIPFS: string;
      message?: string;
    }) => {
      return apiFetch<SeriesSubmission>(`/series/${seriesId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist, imageIPFS, message }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series-submissions", seriesId] });
    },
  });
}
