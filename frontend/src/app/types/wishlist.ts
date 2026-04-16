import type { Address, Visibility } from "./common";

export type WishlistAssetType = "LSP7" | "LSP8" | "other";

export interface WishlistItem {
  id: string;
  profileAddress: Address;
  assetType: WishlistAssetType;
  /** For LSP7 / LSP8 asset types */
  contractAddress?: Address;
  /** For specific LSP8 token */
  tokenId?: string;
  title: string;
  description?: string;
  /** ipfs://... */
  image?: string;
  externalUrl?: string;
  note?: string;
  visibility: Visibility;
}
