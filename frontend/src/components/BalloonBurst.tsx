/**
 * BalloonBurst — full-screen celebration overlay.
 * Triggered via useAppStore.triggerBurst(). Pointer-events: none so it never blocks interaction.
 */
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BalloonIcon } from "./BalloonIcon";
import type { BurstPreset, BurstTheme } from "@/store/useAppStore";

const BALLOON_PALETTES: Record<BurstTheme, string[]> = {
  mixed: ["#6A1B9A", "#9C4EDB", "#FFD700", "#E91E63", "#00BCD4", "#FF7043", "#A8E6CF"],
  birthday: ["#E91E63", "#FFD700", "#9C4EDB", "#F472B6", "#FF8A65"],
  graduation: ["#6A1B9A", "#1D4ED8", "#7C3AED", "#60A5FA", "#E8D9C8"],
  holiday: ["#6A1B9A", "#16A34A", "#FFD700", "#DC2626", "#9C4EDB"],
  anniversary: ["#6A1B9A", "#B45309", "#E8D9C8", "#C084FC", "#F59E0B"],
};

const CONFETTI_BASE = ["#6A1B9A", "#9C4EDB", "#FFD700", "#E8D9C8", "#F5F0E1"];

interface BalloonParticle {
  id: number; left: number; color: string;
  delay: number; duration: number; size: number;
  driftStart: number; driftMid: number; driftEnd: number;
  rotStart: number; rotMid: number; rotEnd: number;
  animVariant: "a" | "b" | "c";
}

interface ConfettiParticle {
  id: number; left: number; top: number; color: string;
  delay: number; duration: number; size: number; isRect: boolean;
  drift: number;
  animVariant: "a" | "b";
}

function generateParticles(preset: BurstPreset, theme: BurstTheme, isMobile: boolean) {
  const config: Record<BurstPreset, { balloons: number; confetti: number; duration: number }> = {
    single: { balloons: 2, confetti: 8, duration: 2.8 },
    gentle: { balloons: 7, confetti: 22, duration: 3.3 },
    celebration: { balloons: 13, confetti: 46, duration: 4.1 },
    epic: { balloons: 20, confetti: 86, duration: 5.2 },
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
        ? 11
        : preset === "celebration" && isMobile
          ? 8
          : baseCfg.balloons,
    confetti:
      preset === "epic" && isMobile
        ? 30
        : preset === "celebration" && isMobile
          ? 18
          : baseCfg.confetti,
  };
  const palette = BALLOON_PALETTES[theme];
  const confettiPalette = [...CONFETTI_BASE, ...palette.slice(0, 3)];
  const [minSize, maxSize] = balloonSizeRanges[preset];
  const sizeScale = isMobile ? 0.9 : 1;

  const balloons: BalloonParticle[] = Array.from({ length: cfg.balloons }, (_, i) => ({
    id: i,
    left: 4 + Math.random() * 92,
    color: palette[Math.floor(Math.random() * palette.length)],
    delay: Math.random() * 0.95,
    duration: cfg.duration - 0.9 + Math.random() * 1.8,
    size: (minSize + Math.random() * (maxSize - minSize)) * sizeScale,
    driftStart: -18 + Math.random() * 36,
    driftMid: -48 + Math.random() * 96,
    driftEnd: -90 + Math.random() * 180,
    rotStart: -22 + Math.random() * 44,
    rotMid: -18 + Math.random() * 36,
    rotEnd: -30 + Math.random() * 60,
    animVariant: (Math.random() < 0.34 ? "a" : Math.random() < 0.67 ? "b" : "c"),
  }));

  const confetti: ConfettiParticle[] = Array.from({ length: cfg.confetti }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: -10 - Math.random() * 30,
    color: confettiPalette[Math.floor(Math.random() * confettiPalette.length)],
    delay: Math.random() * 1.2,
    duration: 2.1 + Math.random() * (preset === "epic" ? 2.6 : 1.6),
    size: preset === "epic" ? 7 + Math.random() * 10 : preset === "celebration" ? 6 + Math.random() * 9 : 5 + Math.random() * 8,
    isRect: Math.random() > 0.45,
    drift: -42 + Math.random() * 84,
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
    const lifetime = burstPreset === "single" ? 2600 : burstPreset === "gentle" ? 3600 : burstPreset === "epic" ? 5600 : 4600;
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
          className={`absolute bottom-0 ${b.animVariant === "a" ? "animate-balloon-rise-a" : b.animVariant === "b" ? "animate-balloon-rise-b" : "animate-balloon-rise-c"}`}
          style={{
            left: `${b.left}%`,
            "--rise-dur": `${b.duration}s`,
            "--rise-delay": `${b.delay}s`,
            "--rise-ease": "cubic-bezier(0.22, 0.78, 0.16, 1)",
            "--x-start": `${b.driftStart}px`,
            "--x-mid": `${b.driftMid}px`,
            "--x-end": `${b.driftEnd}px`,
            "--rot-start": `${b.rotStart}deg`,
            "--rot-mid": `${b.rotMid}deg`,
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
          className={`absolute ${c.animVariant === "a" ? "animate-confetti-fall-a" : "animate-confetti-fall-b"}`}
          style={{
            left: `${c.left}%`,
            top: `${c.top}px`,
            "--fall-dur": `${c.duration}s`,
            "--fall-delay": `${c.delay}s`,
            "--fall-ease": "cubic-bezier(0.2, 0.7, 0.15, 1)",
            "--confetti-drift": `${c.drift}px`,
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
