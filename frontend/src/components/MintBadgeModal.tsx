import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useMintBadge } from "@/hooks/useMintBadge";
import { uploadFileToIPFS } from "@/lib/ipfs";
import { generateTemplateSVG, templateToFile } from "@/lib/celebrationTemplates";
import { TemplatePicker } from "./TemplatePicker";
import { Avatar } from "./Avatar";
import { CELEBRATION_LABELS } from "@/constants/celebrationTypes";
import { LoadingSpinner } from "./LoadingSpinner";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { useT } from "@/hooks/useT";
import type { Address, CelebrationType } from "@/types";
import type { CelebrationTemplate } from "@/lib/celebrationTemplates";
import type { WalletClient } from "viem";

interface MintBadgeModalProps {
  onClose: () => void;
  recipientAddress: Address;
  celebrationType: CelebrationType;
  year: number;
  walletClient: WalletClient | null;
  chainId: number;
}

export function MintBadgeModal({
  onClose,
  recipientAddress,
  celebrationType,
  year,
  walletClient,
  chainId,
}: MintBadgeModalProps) {
  const t = useT();
  const [soulbound, setSoulbound] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<CelebrationTemplate | null>(null);
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: mintBadge, isPending } = useMintBadge(walletClient ?? null, chainId);
  const { data: recipientName } = useLSP3Name(recipientAddress, chainId);

  const label = CELEBRATION_LABELS[celebrationType];
  const recipientDisplay = recipientName
    ?? `${recipientAddress.slice(0, 10)}…${recipientAddress.slice(-6)}`;
  const isBusy = isPending || isUploading;

  // Reactive SVG preview: regenerate whenever template selection changes (label is fixed here)
  useEffect(() => {
    if (!selectedTemplate) return;
    const badgeTitle = `${label} ${year}`;
    const svg = generateTemplateSVG(selectedTemplate, badgeTitle);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedTemplate, label, year]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10 MB)");
      return;
    }
    setSelectedTemplate(null);
    setCustomImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setCustomImageFile(null);
    setSelectedTemplate(null);
    setImagePreview(null);
  };

  const handleMint = async () => {
    try {
      let imageUrl: string | undefined;
      let imageHash: string | undefined;

      const fileToUpload = customImageFile ?? (selectedTemplate ? templateToFile(selectedTemplate, `${label} ${year}`) : null);
      if (fileToUpload) {
        setIsUploading(true);
        const result = await uploadFileToIPFS(fileToUpload);
        imageUrl = result.url;
        imageHash = result.hash;
        setIsUploading(false);
      }

      await mintBadge({ to: recipientAddress, celebrationType, year, soulbound, imageUrl, imageHash });
      toast.success("Badge minted! 🎖️");
      onClose();
    } catch (err) {
      setIsUploading(false);
      const msg = err instanceof Error ? err.message : "Minting failed";
      if (msg.includes("BadgeAlreadyMinted")) {
        toast.error("Badge already minted for this year.");
      } else {
        toast.error(msg.slice(0, 80));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-lukso-card border-t border-lukso-border rounded-t-3xl p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{t.celebrationMintBadge}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">
            {t.close}
          </button>
        </div>

        {/* Recipient */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar address={recipientAddress} size={32} chainId={chainId} />
          <div>
            <p className="text-xs text-white/40">{t.cardTo}</p>
            <p className="text-sm font-medium text-lukso-purple">{recipientDisplay}</p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-2xl bg-lukso-pink/20 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-lukso-purple/50 transition-all group relative"
            title={t.badgeUploadHint}
            aria-label={t.badgeUploadHint}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="badge" className="w-full h-full object-cover" />
            ) : (
              <>
                <span className={`w-10 h-10 rounded-full bg-lukso-pink/40 group-hover:opacity-0 transition-opacity`} />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs text-white/70 transition-opacity">
                  {t.badgeUploadHint}
                </span>
              </>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="text-center">
            <p className="font-semibold">{label} {year}</p>
            {(customImageFile || selectedTemplate) && (
              <button onClick={clearImage} className="text-xs text-white/30 hover:text-white/60 mt-1">
                {t.eventRemove}
              </button>
            )}
          </div>
        </div>

        {/* Template picker — hidden once a custom image is uploaded */}
        {!customImageFile && (
          <div className="mb-4">
            <p className="text-[10px] text-white/30 mb-1.5 text-center">{t.badgePickTemplate}</p>
            <TemplatePicker
              selected={selectedTemplate?.id ?? null}
              onSelect={(tpl) => {
                setCustomImageFile(null);
                setSelectedTemplate(tpl);
              }}
            />
          </div>
        )}

        {/* Options */}
        <div className="card mb-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">{t.badgeSoulbound}</p>
              <p className="text-xs text-white/40 mt-0.5">{t.badgeSoulboundDesc}</p>
            </div>
            <button
              onClick={() => setSoulbound(!soulbound)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                soulbound ? "bg-lukso-pink" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  soulbound ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        <p className="text-xs text-white/30 text-center mb-4">
          {customImageFile ? t.badgeCustomImage : selectedTemplate ? `${t.badgeTemplate} ${selectedTemplate.label}` : t.badgeNoImage} · {t.badgeOnePerYear}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            {t.cancel}
          </button>
          <button
            onClick={handleMint}
            disabled={isBusy}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isBusy ? <LoadingSpinner size="sm" /> : null}
            {isUploading ? t.eventUploading : isPending ? t.badgeMinting : t.badgeMint}
          </button>
        </div>
      </div>
    </div>
  );
}
