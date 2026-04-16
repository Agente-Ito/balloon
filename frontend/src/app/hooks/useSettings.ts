/**
 * useSettings — reads and writes profile settings from ERC725Y.
 * Extracted from `useUniversalProfile.ts` to give settings a dedicated hook.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readAllCelebrationData } from "@/lib/erc725";
import { uploadJSONToIPFS } from "@/lib/ipfs";
import { KEY_SETTINGS } from "@/constants/erc725Keys";
import type { Address, ProfileSettings } from "@/app/types";
import type { WalletClient, Chain } from "viem";

const ERC725Y_SET_ABI = [
  {
    name: "setData",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "dataKey", type: "bytes32" },
      { name: "dataValue", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export const DEFAULT_SETTINGS: ProfileSettings = {
  autoMintBadge:    true,
  birthdayVisible:  true,
  eventsVisible:    true,
  wishlistVisible:  true,
  notifyFollowers:  false,
};

/** Reads full profile data and extracts the settings object */
export function useSettings(profileAddress: Address | null, chainId: number) {
  return useQuery({
    queryKey: ["settings", profileAddress, chainId],
    queryFn: async (): Promise<ProfileSettings> => {
      const data = await readAllCelebrationData(profileAddress!, chainId);
      return data.settings ?? DEFAULT_SETTINGS;
    },
    enabled: !!profileAddress,
    staleTime: 120_000,
  });
}

/** Persists settings JSON to IPFS and writes JSONURL to ERC725Y */
export function useSaveSettings(walletClient: WalletClient | null, upAddress: Address | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: ProfileSettings) => {
      if (!walletClient || !upAddress) throw new Error("Wallet not connected");

      const ipfsUrl = await uploadJSONToIPFS(settings, `celebrations-settings-${upAddress}`);

      // SHA-256 of the JSON → used as content hash in the JSONURL
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(settings))
      );
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const urlHex = Array.from(new TextEncoder().encode(ipfsUrl))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const encodedValue = ("0x6f357c6a" + hashHex + urlHex) as `0x${string}`;

      const [account] = await walletClient.getAddresses();
      return walletClient.writeContract({
        address: upAddress,
        abi: ERC725Y_SET_ABI,
        functionName: "setData",
        args: [KEY_SETTINGS as `0x${string}`, encodedValue],
        account,
        chain: walletClient.chain as Chain,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", upAddress] });
      queryClient.invalidateQueries({ queryKey: ["profileData", upAddress] });
    },
  });
}
