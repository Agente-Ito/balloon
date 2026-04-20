import { useQuery } from "@tanstack/react-query";
import type { Address } from "@/types";

const INDEXER_URL = import.meta.env.VITE_INDEXER_URL ?? "http://localhost:3001/api";

interface FollowersResponse {
  address: Address;
  followers: Address[];
  count: number;
}

interface FollowingResponse {
  address: Address;
  following: Address[];
  count: number;
}

export interface SocialContact {
  address: Address;
  source: "following" | "followers" | "both";
}

export function useSocialContacts(profile: Address | null) {
  return useQuery<SocialContact[]>({
    queryKey: ["socialContacts", profile],
    enabled: !!profile,
    staleTime: 60_000,
    queryFn: async () => {
      const [followingRes, followersRes] = await Promise.all([
        fetch(`${INDEXER_URL}/following/${profile}`),
        fetch(`${INDEXER_URL}/followers/${profile}`),
      ]);

      if (!followingRes.ok || !followersRes.ok) {
        throw new Error("Failed to load social contacts");
      }

      const followingJson = (await followingRes.json()) as FollowingResponse;
      const followersJson = (await followersRes.json()) as FollowersResponse;

      const map = new Map<string, SocialContact>();

      for (const address of followingJson.following ?? []) {
        map.set(address.toLowerCase(), {
          address,
          source: "following",
        });
      }

      for (const address of followersJson.followers ?? []) {
        const key = address.toLowerCase();
        const existing = map.get(key);
        map.set(key, {
          address,
          source: existing ? "both" : "followers",
        });
      }

      return Array.from(map.values());
    },
  });
}
