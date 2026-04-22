import { useState, useCallback } from "react";
import { useT } from "@/hooks/useT";
import { useSocialContacts } from "@/hooks/useSocialContacts";
import { useSendGreeting } from "@/hooks/useSendGreeting";
import { Avatar } from "@/components/Avatar";
import { useLSP3Name } from "@/hooks/useLSP3Name";
import { CelebrationType } from "@/types";
import type { Address } from "@/types";
import type { WalletClient } from "viem";

interface BulkGreetingModalProps {
  onClose: () => void;
  senderAddress: Address;
  walletClient: WalletClient;
  chainId: number;
  /** Pre-selected celebration type (e.g. from a global festivity) */
  celebrationType?: CelebrationType;
}

const PRESET_KEYS = [
  "bulkGreetPreset1",
  "bulkGreetPreset2",
  "bulkGreetPreset3",
  "bulkGreetPreset4",
  "bulkGreetPreset5",
] as const;

function ContactRow({
  address,
  chainId,
  selected,
  onToggle,
  status,
}: {
  address: Address;
  chainId: number;
  selected: boolean;
  onToggle: () => void;
  status?: "ok" | "error" | "pending";
}) {
  const { data: name } = useLSP3Name(address, chainId);
  const label = name ?? `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <button
      onClick={onToggle}
      disabled={status === "ok" || status === "pending"}
      className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
      style={{
        background: selected ? "rgba(106,27,154,0.10)" : "transparent",
        border: selected ? "1px solid rgba(106,27,154,0.35)" : "1px solid #E8D9C8",
      }}
    >
      <Avatar address={address} size={28} chainId={chainId} />
      <span className="flex-1 text-xs font-medium truncate">{label}</span>
      {status === "ok" && <span className="text-green-400 text-xs shrink-0">✓</span>}
      {status === "error" && <span className="text-red-400 text-xs shrink-0">✗</span>}
      {status === "pending" && (
        <span className="text-xs text-white/30 shrink-0 animate-pulse">…</span>
      )}
      {!status && (
        <span
          className="w-4 h-4 rounded-full border-2 shrink-0 transition-colors"
          style={{
            background: selected ? "#6A1B9A" : "transparent",
            borderColor: selected ? "#6A1B9A" : "rgba(255,255,255,0.2)",
          }}
        />
      )}
    </button>
  );
}

type SendStatus = "ok" | "error" | "pending";

export function BulkGreetingModal({
  onClose,
  senderAddress,
  walletClient,
  chainId,
  celebrationType = CelebrationType.CustomEvent,
}: BulkGreetingModalProps) {
  const t = useT();
  const { data: contacts = [] } = useSocialContacts(senderAddress);
  const sendGreeting = useSendGreeting(walletClient, senderAddress, chainId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<Set<Address>>(new Set());
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [customMessage, setCustomMessage] = useState("");
  const [statusMap, setStatusMap] = useState<Record<string, SendStatus>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = useCallback(
    (addr: Address) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(addr)) next.delete(addr);
        else next.add(addr);
        return next;
      }),
    []
  );

  const selectAll = () => setSelected(new Set(contacts.map((c) => c.address)));
  const deselectAll = () => setSelected(new Set());

  const message = customMessage.trim() || t[PRESET_KEYS[presetIndex]];

  const okCount = Object.values(statusMap).filter((s) => s === "ok").length;
  const errCount = Object.values(statusMap).filter((s) => s === "error").length;

  const handleSend = async () => {
    setSending(true);
    const recipients = Array.from(selected);
    for (const addr of recipients) {
      setStatusMap((prev) => ({ ...prev, [addr]: "pending" }));
      try {
        await sendGreeting.mutateAsync({
          to: addr,
          celebrationType,
          message,
        });
        setStatusMap((prev) => ({ ...prev, [addr]: "ok" }));
      } catch {
        setStatusMap((prev) => ({ ...prev, [addr]: "error" }));
      }
    }
    setSending(false);
    setDone(true);
  };

  const totalSelected = selected.size;

  const stepLabel = step === 1 ? t.bulkGreetStep1 : step === 2 ? t.bulkGreetStep2 : t.bulkGreetStep3;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[88vh] bg-lukso-card border border-lukso-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div>
            <h2 className="title-premium text-sm font-semibold">{t.bulkGreetTitle}</h2>
            <p className="text-xs text-white/30 mt-0.5">{stepLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-4 pb-3 shrink-0">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{
                background: s <= step ? "#6A1B9A" : "rgba(106,27,154,0.12)",
              }}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
          {/* ── Step 1: pick contacts ─────────────────────────── */}
          {step === 1 && (
            <>
              {contacts.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-6">{t.bulkGreetNoEligible}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/30">
                      {totalSelected} / {contacts.length}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={selectAll} className="text-[11px] text-lukso-purple/80">
                        {t.bulkGreetSelectAll}
                      </button>
                      <button onClick={deselectAll} className="text-[11px] text-white/30">
                        {t.bulkGreetDeselectAll}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {contacts.map((c) => (
                      <ContactRow
                        key={c.address}
                        address={c.address}
                        chainId={chainId}
                        selected={selected.has(c.address)}
                        onToggle={() => toggle(c.address)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Step 2: pick message ──────────────────────────── */}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-2">
                {PRESET_KEYS.map((key, i) => (
                  <button
                    key={key}
                    onClick={() => {
                      setPresetIndex(i);
                      setCustomMessage("");
                    }}
                    className="text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{
                      background:
                        presetIndex === i && !customMessage.trim()
                          ? "rgba(106,27,154,0.10)"
                          : "transparent",
                      border:
                        presetIndex === i && !customMessage.trim()
                          ? "1px solid rgba(106,27,154,0.40)"
                          : "1px solid #E8D9C8",
                    }}
                  >
                    {t[key]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/30 mt-1">{t.bulkGreetCustom}</p>
              <textarea
                className="input text-sm resize-none"
                rows={3}
                placeholder="✍️"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </>
          )}

          {/* ── Step 3: confirm ───────────────────────────────── */}
          {step === 3 && (
            <>
              {!done && !sending && (
                <div
                  className="rounded-xl px-3 py-2.5 text-xs text-amber-700"
                  style={{ background: "rgba(217,119,6,0.08)" }}
                >
                  {t.bulkGreetGasWarning}
                </div>
              )}

              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {Array.from(selected).map((addr) => (
                  <ContactRow
                    key={addr}
                    address={addr}
                    chainId={chainId}
                    selected
                    onToggle={() => {}}
                    status={statusMap[addr]}
                  />
                ))}
              </div>

              <div
                className="rounded-xl px-3 py-2 text-xs italic text-white/40"
                style={{ background: "rgba(106,27,154,0.05)" }}
              >
                "{message}"
              </div>

              {sending && (
                <p className="text-xs text-center text-white/40 animate-pulse">
                  {t.bulkGreetSending}{" "}
                  {t.bulkGreetProgress
                    .replace("{n}", String(okCount + errCount))
                    .replace("{total}", String(totalSelected))}
                </p>
              )}

              {done && (
                <p className="text-xs text-center text-green-700">
                  {t.bulkGreetDone
                    .replace("{ok}", String(okCount))
                    .replace("{failed}", String(errCount))}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 shrink-0 flex flex-col gap-2">
          {!done && step < 3 && (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 && totalSelected === 0}
              className="btn-primary w-full"
            >
              {t.bulkGreetNext}
            </button>
          )}

          {step === 3 && !done && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary w-full"
            >
              {sending ? t.bulkGreetSending : t.bulkGreetConfirmBtn}{" "}
              {!sending && `(${totalSelected})`}
            </button>
          )}

          {done && (
            <button onClick={onClose} className="btn-secondary w-full">
              {t.bulkGreetDone
                .replace("{ok}", String(okCount))
                .replace("{failed}", String(errCount))}
            </button>
          )}

          {step === 1 && !done && (
            <button onClick={onClose} className="btn-ghost w-full">
              {t.cancel}
            </button>
          )}

          {step > 1 && !done && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="btn-ghost w-full text-white/40"
              disabled={sending}
            >
              ←
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
