import type { Address } from "./common";

export interface FollowRelation {
  followerProfile: Address;
  followedProfile: Address;
  createdAt: number; // unix timestamp
  active: boolean;
}
