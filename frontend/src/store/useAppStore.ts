import { create } from "zustand";
import type { Address, AppView, Celebration } from "@/types";
import { type Lang, getStoredLang, setStoredLang } from "@/lib/i18n";

export type BurstPreset = "single" | "gentle" | "celebration" | "epic";
export type BurstTheme = "mixed" | "birthday" | "graduation" | "holiday" | "anniversary";

const BURST_COOLDOWN_MS = 1500;

function burstRank(preset: BurstPreset): number {
  if (preset === "single") return 1;
  if (preset === "gentle") return 2;
  if (preset === "celebration") return 3;
  return 4;
}

interface AppStore {
  // Balloon burst celebration animation
  burstActive: boolean;
  burstPreset: BurstPreset;
  burstTheme: BurstTheme;
  lastBurstAt: number;
  triggerBurst: (preset?: BurstPreset, theme?: BurstTheme) => void;
  clearBurst: () => void;

  // Navigation
  currentView: AppView;
  viewHistory: AppView[];
  setView: (view: AppView) => void;
  goBack: (fallback?: AppView) => void;

  // Active drop detail context
  activeDropId: string | null;
  setActiveDropId: (dropId: string | null) => void;

  // UX: temporary notice after creating a drop to guide next actions
  postCreateDropNotice: {
    name: string;
    month: number;
    day: number;
    year: number;
    createdAt: number;
  } | null;
  setPostCreateDropNotice: (notice: {
    name: string;
    month: number;
    day: number;
    year: number;
    createdAt: number;
  } | null) => void;
  clearPostCreateDropNotice: () => void;

  // Optional editor entry intent (used to land in a specific tab/subview)
  editorEntryTab: "dates" | "drops" | "wishlist" | "settings" | null;
  editorEntrySubView: "main" | "addEvent" | "addWishlist" | "addDrop" | "quickCreate" | null;
  setEditorEntry: (
    tab: "dates" | "drops" | "wishlist" | "settings" | null,
    subView: "main" | "addEvent" | "addWishlist" | "addDrop" | "quickCreate" | null
  ) => void;
  clearEditorEntry: () => void;

  // Active series (for SeriesView)
  activeSeriesId: string | null;
  setActiveSeriesId: (id: string | null) => void;

  // Active celebration (for CelebrationView)
  activeCelebrationDate: string | null;
  setActiveCelebrationDate: (date: string | null) => void;

  // Cross-view: calendar day → editor drop form
  // Set before navigating to "editor"; Editor reads it once then clears it.
  pendingDropDate: string | null;          // "YYYY-MM-DD"
  setPendingDropDate: (date: string | null) => void;

  // Explicit flag: only prefill anniversary drop when user asks for it
  pendingAnniversaryDrop: boolean;
  setPendingAnniversaryDrop: (enabled: boolean) => void;

  // Cross-view: calendar reminder row → editor quick-create (edit mode)
  pendingEventDraft: Celebration | null;
  setPendingEventDraft: (event: Celebration | null) => void;

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
  burstPreset: "celebration",
  burstTheme: "mixed",
  lastBurstAt: 0,
  triggerBurst: (preset = "celebration", theme = "mixed") => {
    const state = get();
    const now = Date.now();
    const withinCooldown = now - state.lastBurstAt < BURST_COOLDOWN_MS;

    // Prevent visual spam: during cooldown only allow stronger bursts to override.
    if (withinCooldown && burstRank(preset) <= burstRank(state.burstPreset)) {
      return;
    }

    set({ burstActive: true, burstPreset: preset, burstTheme: theme, lastBurstAt: now });
  },
  clearBurst: () => set({ burstActive: false }),

  currentView: "grid",
  viewHistory: [],
  setView: (view) => set((state) => ({
    currentView: view,
    viewHistory:
      state.currentView === view
        ? state.viewHistory
        : [...state.viewHistory, state.currentView],
  })),
  goBack: (fallback = "grid") => set((state) => ({
    currentView:
      state.viewHistory.length > 0
        ? state.viewHistory[state.viewHistory.length - 1]
        : fallback,
    viewHistory:
      state.viewHistory.length > 0
        ? state.viewHistory.slice(0, -1)
        : state.viewHistory,
  })),

  activeDropId: null,
  setActiveDropId: (dropId) => set({ activeDropId: dropId }),

  postCreateDropNotice: null,
  setPostCreateDropNotice: (notice) => set({ postCreateDropNotice: notice }),
  clearPostCreateDropNotice: () => set({ postCreateDropNotice: null }),

  editorEntryTab: null,
  editorEntrySubView: null,
  setEditorEntry: (tab, subView) => set({ editorEntryTab: tab, editorEntrySubView: subView }),
  clearEditorEntry: () => set({ editorEntryTab: null, editorEntrySubView: null }),

  activeSeriesId: null,
  setActiveSeriesId: (id) => set({ activeSeriesId: id }),

  activeCelebrationDate: null,
  setActiveCelebrationDate: (date) => set({ activeCelebrationDate: date }),

  pendingDropDate: null,
  setPendingDropDate: (date) => set({ pendingDropDate: date }),

  pendingAnniversaryDrop: false,
  setPendingAnniversaryDrop: (enabled) => set({ pendingAnniversaryDrop: enabled }),

  pendingEventDraft: null,
  setPendingEventDraft: (event) => set({ pendingEventDraft: event }),

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
