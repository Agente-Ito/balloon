import { create } from "zustand";
import type { Address, AppView } from "@/types";
import { type Lang, getStoredLang, setStoredLang } from "@/lib/i18n";

interface AppStore {
  // Balloon burst celebration animation
  burstActive: boolean;
  triggerBurst: () => void;
  clearBurst: () => void;

  // Navigation
  currentView: AppView;
  setView: (view: AppView) => void;

  // Active celebration (for CelebrationView)
  activeCelebrationDate: string | null;
  setActiveCelebrationDate: (date: string | null) => void;

  // Cross-view: calendar day → editor drop form
  // Set before navigating to "editor"; Editor reads it once then clears it.
  pendingDropDate: string | null;          // "YYYY-MM-DD"
  setPendingDropDate: (date: string | null) => void;

  // Profile being viewed (context profile from UP Provider)
  contextProfile: Address | null;
  setContextProfile: (address: Address | null) => void;

  // Connected account (the viewer)
  connectedAccount: Address | null;
  setConnectedAccount: (address: Address | null) => void;

  // Chain
  chainId: number;
  setChainId: (chainId: number) => void;

  // Is the viewer the owner of the context profile?
  isOwner: boolean;

  // Language
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  burstActive: false,
  triggerBurst: () => set({ burstActive: true }),
  clearBurst: () => set({ burstActive: false }),

  currentView: "grid",
  setView: (view) => set({ currentView: view }),

  activeCelebrationDate: null,
  setActiveCelebrationDate: (date) => set({ activeCelebrationDate: date }),

  pendingDropDate: null,
  setPendingDropDate: (date) => set({ pendingDropDate: date }),

  contextProfile: null,
  setContextProfile: (address) => {
    const { connectedAccount } = get();
    set({
      contextProfile: address,
      isOwner: !!address && address.toLowerCase() === connectedAccount?.toLowerCase(),
    });
  },

  connectedAccount: null,
  setConnectedAccount: (address) => {
    const { contextProfile } = get();
    set({
      connectedAccount: address,
      isOwner: !!address && address?.toLowerCase() === contextProfile?.toLowerCase(),
    });
  },

  chainId: Number(import.meta.env.VITE_CHAIN_ID ?? 4201),
  setChainId: (chainId) => set({ chainId }),

  isOwner: false,

  lang: getStoredLang(),
  setLang: (lang) => { setStoredLang(lang); set({ lang }); },
}));
