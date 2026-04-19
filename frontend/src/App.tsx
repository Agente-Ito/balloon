import { useEffect } from "react";
import { useUpProvider } from "@/hooks/useUpProvider";
import { useAppStore } from "@/store/useAppStore";
import { GridCard } from "@/views/GridCard/GridCard";
import { CalendarView } from "@/views/CalendarView/CalendarView";
import { CelebrationView } from "@/views/CelebrationView/CelebrationView";
import { Editor } from "@/views/Editor/Editor";
import { Wishlist } from "@/views/Wishlist/Wishlist";
import { DropsDiscoverView } from "@/views/DropsDiscoverView/DropsDiscoverView";
import { DropsManageView } from "@/views/DropsManageView/DropsManageView";
import { DropDetailView } from "@/views/DropDetailView/DropDetailView";
import { SeriesView } from "@/views/SeriesView/SeriesView";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BalloonBurst } from "@/components/BalloonBurst";
import { ContractsProvider } from "@/app/providers/ContractsProvider";

export default function App() {
  const { account, contextProfile, chainId, walletClient, publicClient, isLoading, error } =
    useUpProvider();
  const { currentView, setConnectedAccount, setContextProfile, setChainId } = useAppStore();

  // Sync UP Provider state into the app store
  useEffect(() => {
    if (account) setConnectedAccount(account);
  }, [account, setConnectedAccount]);

  useEffect(() => {
    if (contextProfile) setContextProfile(contextProfile);
    else if (account) setContextProfile(account);
  }, [contextProfile, account, setContextProfile]);

  useEffect(() => {
    setChainId(chainId);
  }, [chainId, setChainId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#F5F0E1" }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen gap-3 px-6 text-center"
        style={{ background: "#F5F0E1" }}
      >
        <div className="text-2xl">⚠️</div>
        <p className="text-sm" style={{ color: "rgba(44,44,44,0.6)" }}>
          Could not connect to Universal Profile
        </p>
        <p className="text-xs font-mono" style={{ color: "rgba(44,44,44,0.4)" }}>
          {error}
        </p>
      </div>
    );
  }

  const sharedProps = {
    walletClient: walletClient ?? undefined,
    publicClient,
    chainId,
  };

  return (
    <ContractsProvider walletClient={walletClient} publicClient={publicClient} chainId={chainId}>
      <div className="h-screen overflow-hidden animate-fade-in">
        {currentView === "grid" && <GridCard {...sharedProps} />}
        {currentView === "calendar" && <CalendarView {...sharedProps} />}
        {currentView === "celebration" && <CelebrationView {...sharedProps} />}
        {currentView === "editor" && <Editor {...sharedProps} />}
        {currentView === "wishlist" && <Wishlist {...sharedProps} />}
        {currentView === "drops" && <DropsDiscoverView walletClient={sharedProps.walletClient} chainId={sharedProps.chainId} />}
        {currentView === "drops-manage" && <DropsManageView walletClient={sharedProps.walletClient} chainId={sharedProps.chainId} />}
        {currentView === "drop-detail" && <DropDetailView walletClient={sharedProps.walletClient} chainId={sharedProps.chainId} />}
        {currentView === "series" && <SeriesView walletClient={sharedProps.walletClient} chainId={sharedProps.chainId} />}
      </div>
      {/* Global balloon burst — overlays any view on celebrate actions */}
      <BalloonBurst />
    </ContractsProvider>
  );
}
