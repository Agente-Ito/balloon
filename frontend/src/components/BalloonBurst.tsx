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
}

interface ConfettiParticle {
  id: number; left: number; top: number; color: string;
  delay: number; duration: number; size: number; isRect: boolean;
}

function generateParticles(preset: BurstPreset, theme: BurstTheme, isMobile: boolean) {
  const config: Record<BurstPreset, { balloons: number; confetti: number; duration: number }> = {
    single: { balloons: 1, confetti: 0, duration: 2.4 },
    gentle: { balloons: 4, confetti: 8, duration: 3.0 },
    celebration: { balloons: 8, confetti: 16, duration: 3.8 },
    epic: { balloons: 13, confetti: 40, duration: 4.8 },
  };
  const baseCfg = config[preset];
  const cfg = {
    ...baseCfg,
    // On mobile we tone down only the standard celebration confetti.
    confetti: preset === "celebration" && isMobile ? 9 : baseCfg.confetti,
  };
  const palette = BALLOON_PALETTES[theme];
  const confettiPalette = [...CONFETTI_BASE, ...palette.slice(0, 3)];

  const balloons: BalloonParticle[] = Array.from({ length: cfg.balloons }, (_, i) => ({
    id: i,
    left: 4 + Math.random() * 92,
    color: palette[Math.floor(Math.random() * palette.length)],
    delay: Math.random() * 0.9,
    duration: cfg.duration - 1 + Math.random() * 1.4,
    size: 26 + Math.random() * 24,
  }));

  const confetti: ConfettiParticle[] = Array.from({ length: cfg.confetti }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: -10 - Math.random() * 30,
    color: confettiPalette[Math.floor(Math.random() * confettiPalette.length)],
    delay: Math.random() * 1.2,
    duration: 2.1 + Math.random() * (preset === "epic" ? 2.6 : 1.6),
    size: 5 + Math.random() * 8,
    isRect: Math.random() > 0.45,
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
    const lifetime = burstPreset === "single" ? 2200 : burstPreset === "gentle" ? 3200 : burstPreset === "epic" ? 5200 : 4300;
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
          className="absolute bottom-0 animate-balloon-rise"
          style={{
            left: `${b.left}%`,
            "--rise-dur": `${b.duration}s`,
            "--rise-delay": `${b.delay}s`,
          } as React.CSSProperties}
        >
          <BalloonIcon size={b.size} color={b.color} foil />
        </div>
      ))}

      {particles.confetti.map((c) => (
        <div
          key={c.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${c.left}%`,
            top: `${c.top}px`,
            "--fall-dur": `${c.duration}s`,
            "--fall-delay": `${c.delay}s`,
            width: c.size,
            height: c.isRect ? c.size * 0.55 : c.size,
            backgroundColor: c.color,
            borderRadius: c.isRect ? "2px" : "50%",
            opacity: 0.85,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
