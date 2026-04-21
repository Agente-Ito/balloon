/**
 * BalloonBurst — full-screen celebration overlay.
 * Triggered via useAppStore.triggerBurst(). Pointer-events: none so it never blocks interaction.
 */
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BalloonIcon } from "./BalloonIcon";
import type { BurstPreset, BurstTheme } from "@/store/useAppStore";

const BALLOON_PALETTES: Record<BurstTheme, string[]> = {
  // Metallic pastel direction: rose, champagne, silver, lilac and soft gold.
  mixed: ["#E7B7C7", "#C8CEDA", "#E7CF9A", "#D7C6F5", "#EAC9B9", "#BFD3C8", "#C97A84"],
  birthday: ["#EAAFC2", "#F3D3DF", "#E8D6A8", "#D9C9F7", "#C8CEDA", "#C97A84"],
  graduation: ["#C9BAEA", "#C8CEDA", "#E8D6A8", "#C7D8EC", "#E5D6C7"],
  holiday: ["#D7C6F5", "#C8CEDA", "#E8D6A8", "#C7D7C8", "#C97A84"],
  anniversary: ["#EAC9B9", "#E7B7C7", "#E8D6A8", "#C8CEDA", "#D7C6F5"],
};

const CONFETTI_BASE = ["#D7C6F5", "#E7B7C7", "#E8D6A8", "#C8CEDA", "#F5F0E1", "#E8D9C8"];

interface BalloonParticle {
  id: number; color: string;
  delay: number; duration: number; size: number;
  endX: number; endY: number;
  rotStart: number; rotEnd: number;
  animVariant: "a" | "b";
}

interface ConfettiParticle {
  id: number; color: string;
  delay: number; duration: number; size: number; isRect: boolean;
  endX: number; endY: number;
  animVariant: "a" | "b";
}

function generateParticles(preset: BurstPreset, theme: BurstTheme, isMobile: boolean) {
  const config: Record<BurstPreset, { balloons: number; confetti: number; duration: number }> = {
    single: { balloons: 3, confetti: 12, duration: 2.9 },
    gentle: { balloons: 11, confetti: 36, duration: 3.4 },
    celebration: { balloons: 21, confetti: 92, duration: 4.2 },
    epic: { balloons: 32, confetti: 150, duration: 5.3 },
  };
  const balloonSizeRanges: Record<BurstPreset, [number, number]> = {
    single: [44, 58],
    gentle: [42, 64],
    celebration: [48, 76],
    epic: [54, 88],
  };
  const baseCfg = config[preset];
  const cfg = {
    ...baseCfg,
    // Mobile: reduce particle count to keep animation fluid on mid/low-end devices.
    balloons:
      preset === "epic" && isMobile
        ? 17
        : preset === "celebration" && isMobile
          ? 12
          : baseCfg.balloons,
    confetti:
      preset === "epic" && isMobile
        ? 52
        : preset === "celebration" && isMobile
          ? 34
          : baseCfg.confetti,
  };
  const palette = BALLOON_PALETTES[theme];
  const confettiPalette = [...CONFETTI_BASE, ...palette.slice(0, 3)];
  const [minSize, maxSize] = balloonSizeRanges[preset];
  const sizeScale = isMobile ? 0.9 : 1;

  const balloons: BalloonParticle[] = Array.from({ length: cfg.balloons }, (_, i) => ({
    id: i,
    color: palette[Math.floor(Math.random() * palette.length)],
    delay: Math.random() * 0.22,
    duration: cfg.duration - 1.2 + Math.random() * 1.2,
    size: (minSize + Math.random() * (maxSize - minSize)) * sizeScale,
    ...(() => {
      // Firework-like spread: mostly upward with different lateral trajectories.
      const angle = (-155 + Math.random() * 130) * (Math.PI / 180);
      const distance = (isMobile ? 180 : 220) + Math.random() * (isMobile ? 200 : 320);
      return {
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance,
      };
    })(),
    rotStart: -18 + Math.random() * 36,
    rotEnd: -90 + Math.random() * 180,
    animVariant: Math.random() > 0.5 ? "a" : "b",
  }));

  const confetti: ConfettiParticle[] = Array.from({ length: cfg.confetti }, (_, i) => ({
    id: i,
    color: confettiPalette[Math.floor(Math.random() * confettiPalette.length)],
    delay: Math.random() * 0.26,
    duration: 1.6 + Math.random() * (preset === "epic" ? 1.3 : 0.9),
    size: preset === "epic" ? 7 + Math.random() * 10 : preset === "celebration" ? 6 + Math.random() * 9 : 5 + Math.random() * 8,
    isRect: Math.random() > 0.45,
    ...(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = (isMobile ? 80 : 95) + Math.random() * (isMobile ? 140 : 190);
      // Slight downward bias for confetti while still feeling explosive.
      return {
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance + (20 + Math.random() * 90),
      };
    })(),
    animVariant: Math.random() > 0.5 ? "a" : "b",
  }));

  return { balloons, confetti };
}

export function BalloonBurst() {
  const { burstActive, burstPreset, burstTheme, clearBurst } = useAppStore();
  const [particles, setParticles] = useState<{ balloons: BalloonParticle[]; confetti: ConfettiParticle[] } | null>(null);

  useEffect(() => {
    if (!burstActive) return;
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
    setParticles(generateParticles(burstPreset, burstTheme, isMobile));
    const lifetime = burstPreset === "single" ? 2200 : burstPreset === "gentle" ? 2700 : burstPreset === "epic" ? 3600 : 3100;
    const timer = setTimeout(clearBurst, lifetime);
    return () => clearTimeout(timer);
  }, [burstActive, burstPreset, burstTheme, clearBurst]);

  if (!burstActive || !particles) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      {particles.balloons.map((b) => (
        <div
          key={b.id}
          className={`absolute left-1/2 top-[70%] ${b.animVariant === "a" ? "animate-balloon-burst-a" : "animate-balloon-burst-b"}`}
          style={{
            "--burst-dur": `${b.duration}s`,
            "--burst-delay": `${b.delay}s`,
            "--burst-ease": "cubic-bezier(0.22, 0.78, 0.18, 1)",
            "--burst-x": `${b.endX}px`,
            "--burst-y": `${b.endY}px`,
            "--rot-start": `${b.rotStart}deg`,
            "--rot-end": `${b.rotEnd}deg`,
            willChange: "transform, opacity",
            transform: "translateZ(0)",
          } as React.CSSProperties}
        >
          <BalloonIcon size={b.size} color={b.color} foil />
        </div>
      ))}

      {particles.confetti.map((c) => (
        <div
          key={c.id}
          className={`absolute left-1/2 top-[70%] ${c.animVariant === "a" ? "animate-confetti-burst-a" : "animate-confetti-burst-b"}`}
          style={{
            "--fall-dur": `${c.duration}s`,
            "--fall-delay": `${c.delay}s`,
            "--fall-ease": "cubic-bezier(0.22, 0.8, 0.25, 1)",
            "--burst-x": `${c.endX}px`,
            "--burst-y": `${c.endY}px`,
            width: c.size,
            height: c.isRect ? c.size * 0.55 : c.size,
            backgroundColor: c.color,
            borderRadius: c.isRect ? "2px" : "50%",
            opacity: 0.85,
            willChange: "transform, opacity",
            transform: "translateZ(0)",
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
