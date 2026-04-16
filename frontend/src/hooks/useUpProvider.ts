/**
 * Initializes the @lukso/up-provider and exposes the connected account,
 * chainId, and viem wallet/public clients.
 *
 * In the LUKSO Grid:
 *  - The UP Provider is injected by the host (the profile browser).
 *  - getAddresses() returns the Universal Profile address of the viewer.
 *  - contextAccounts[0] is the profile being viewed (arrives async via event).
 */
import { useState, useEffect, useCallback } from "react";
import { createClientUPProvider } from "@lukso/up-provider";
import { createUPWalletClient, getPublicClient } from "@/lib/lukso";
import type { WalletClient, PublicClient } from "viem";
import type { Address } from "@/types";

// Dev fallback — used when running outside the LUKSO Grid (localhost)
const DEV_CONTEXT_PROFILE = (import.meta.env.VITE_DEV_UP_ADDRESS ?? "") as Address;

interface UPProviderState {
  provider: ReturnType<typeof createClientUPProvider> | null;
  walletClient: WalletClient | null;
  publicClient: PublicClient;
  account: Address | null;
  /** The profile currently being viewed in the Grid (may differ from account) */
  contextProfile: Address | null;
  chainId: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useUpProvider() {
  const defaultChainId = Number(import.meta.env.VITE_CHAIN_ID ?? 4201);

  const [state, setState] = useState<UPProviderState>({
    provider: null,
    walletClient: null,
    publicClient: getPublicClient(defaultChainId),
    account: null,
    contextProfile: null,
    chainId: defaultChainId,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const init = useCallback(async () => {
    try {
      const upProvider = createClientUPProvider();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = upProvider as any;

      const chainIdHex = await p.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);

      const walletClient = createUPWalletClient(upProvider, chainId);
      const publicClient = getPublicClient(chainId);

      const accounts = await walletClient.getAddresses();
      // In the Grid the extension may not grant accounts immediately — fall back to
      // DEV_CONTEXT_PROFILE in dev so isOwner works when viewing your own profile locally.
      const account = ((accounts[0] as Address) ??
        (import.meta.env.DEV ? DEV_CONTEXT_PROFILE || null : null)) as Address | null;

      // contextAccounts[0] = the profile being viewed in the Grid.
      // May be empty on first load — we also listen for contextAccountsChanged below.
      const contextProfiles: string[] = p.contextAccounts ?? [];
      const contextProfile =
        (contextProfiles[0] as Address) ??
        account ??
        (import.meta.env.DEV ? DEV_CONTEXT_PROFILE || null : null);

      setState({
        provider: upProvider,
        walletClient,
        publicClient,
        account,
        contextProfile,
        chainId,
        isConnected: !!account,
        isLoading: false,
        error: null,
      });

      // Context profile changes when the Grid navigates to a different profile
      p.on("contextAccountsChanged", (newContextAccounts: string[]) => {
        setState((prev) => ({
          ...prev,
          contextProfile: (newContextAccounts[0] as Address) ?? prev.account ?? null,
        }));
      });

      p.on("accountsChanged", (newAccounts: string[]) => {
        setState((prev) => ({
          ...prev,
          account: (newAccounts[0] as Address) ?? null,
          isConnected: newAccounts.length > 0,
          // If no explicit context, fall back to connected account
          contextProfile: prev.contextProfile ?? (newAccounts[0] as Address) ?? null,
        }));
      });

      p.on("chainChanged", (newChainIdHex: string) => {
        const newChainId = parseInt(newChainIdHex, 16);
        setState((prev) => ({
          ...prev,
          chainId: newChainId,
          walletClient: createUPWalletClient(upProvider, newChainId),
          publicClient: getPublicClient(newChainId),
        }));
      });
    } catch (err) {
      // Outside the Grid or extension not installed — use dev fallback if available
      const devProfile = import.meta.env.DEV ? DEV_CONTEXT_PROFILE || null : null;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        // In dev, treat the fallback profile as both the viewer and the context
        // so that isOwner === true and the editor is accessible
        account: devProfile,
        contextProfile: devProfile,
        isConnected: !!devProfile,
        error: devProfile ? null : (err instanceof Error ? err.message : "Failed to connect to UP Provider"),
      }));
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return state;
}
