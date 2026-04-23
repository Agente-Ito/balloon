/**
 * BalloonBurst — full-screen celebration overlay.
 * Triggered via useAppStore.triggerBurst(). Pointer-events: none so it never blocks interaction.
 */
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BalloonIcon } from "./BalloonIcon";
import type { BurstPreset, BurstTheme } from "@/store/useAppStore";

const BALLOON_PALETTES: Record<BurstTheme, string[]> = {
  mixed: ["#E7B7C7", "#C8CEDA", "#E7CF9A", "#D7C6F5", "#EAC9B9", "#BFD3C8", "#C97A84"],
  birthday: ["#EAAFC2", "#F3D3DF", "#E8D6A8", "#D9C9F7", "#C8CEDA", "#C97A84"],
  graduation: ["#C9BAEA", "#C8CEDA", "#E8D6A8", "#C7D8EC", "#E5D6C7"],
  holiday: ["#D7C6F5", "#C8CEDA", "#E8D6A8", "#C7D7C8", "#C97A84"],
  anniversary: ["#EAC9B9", "#E7B7C7", "#E8D6A8", "#C8CEDA", "#D7C6F5"],
};

// Vivid metallic colors for round balloons — complement the pastel foil palette.
const ROUND_METALLIC_COLORS = [
  "#E8433A", // metallic red
  "#3B82D4", // metallic cobalt
  "#34A85A", // metallic emerald
  "#C8932A", // metallic gold
  "#9C5FC4", // metallic violet
  "#E84393", // metallic magenta
  "#1BAF9C", // metallic teal
  "#E87A34", // metallic orange
];

const CONFETTI_BASE = ["#D7C6F5", "#E7B7C7", "#E8D6A8", "#C8CEDA", "#F5F0E1", "#E8D9C8"];

interface BalloonParticle {
  id: number; color: string;
  balloonType: "foil" | "round";
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

function RoundBalloon({ size, color, uid }: { size: number; color: string; uid: number }) {
  const gradId = `rbg-${uid}`;
  return (
    <svg
      viewBox="0 0 60 78"
      width={size}
      height={size * 1.3}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <radialGradient id={gradId} cx="36%" cy="30%" r="60%" fx="36%" fy="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.72)" />
          <stop offset="28%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.78" />
        </radialGradient>
      </defs>
      {/* Body */}
      <ellipse cx="30" cy="30" rx="27" ry="29" fill={`url(#${gradId})`} />
      {/* Knot */}
      <polygon points="27,58 33,58 30,64" fill={color} opacity="0.88" />
      {/* String */}
      <path d="M30 64 Q35 70 27 76" stroke={color} strokeWidth="1.3" fill="none" opacity="0.48" strokeLinecap="round" />
    </svg>
  );
}

function generateParticles(preset: BurstPreset, theme: BurstTheme, isMobile: boolean) {
  const config: Record<BurstPreset, { balloons: number; confetti: number; duration: number }> = {
    single:      { balloons: 4,  confetti: 14,  duration: 2.9 },
    gentle:      { balloons: 15, confetti: 55,  duration: 3.4 },
    celebration: { balloons: 28, confetti: 130, duration: 4.2 },
    epic:        { balloons: 42, confetti: 200, duration: 5.3 },
  };
  const balloonSizeRanges: Record<BurstPreset, [number, number]> = {
    single:      [44, 58],
    gentle:      [42, 64],
    celebration: [48, 76],
    epic:        [54, 88],
  };
  const baseCfg = config[preset];
  const cfg = {
    ...baseCfg,
    balloons:
      preset === "epic" && isMobile        ? 22
      : preset === "celebration" && isMobile ? 16
      : baseCfg.balloons,
    confetti:
      preset === "epic" && isMobile        ? 75
      : preset === "celebration" && isMobile ? 48
      : baseCfg.confetti,
  };
  const palette = BALLOON_PALETTES[theme];
  const confettiPalette = [...CONFETTI_BASE, ...palette.slice(0, 3)];
  const [minSize, maxSize] = balloonSizeRanges[preset];
  const sizeScale = isMobile ? 0.9 : 1;

  const balloons: BalloonParticle[] = Array.from({ length: cfg.balloons }, (_, i) => {
    const isRound = Math.random() < 0.40; // ~40% round metallic, ~60% foil
    return {
      id: i,
      balloonType: isRound ? "round" : "foil",
      color: isRound
        ? ROUND_METALLIC_COLORS[Math.floor(Math.random() * ROUND_METALLIC_COLORS.length)]
        : palette[Math.floor(Math.random() * palette.length)],
      delay: Math.random() * 0.22,
      duration: cfg.duration - 1.2 + Math.random() * 1.2,
      size: (minSize + Math.random() * (maxSize - minSize)) * sizeScale,
      ...(() => {
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
    };
  });

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
          {b.balloonType === "round" ? (
            <RoundBalloon size={b.size} color={b.color} uid={b.id} />
          ) : (
            <BalloonIcon size={b.size} color={b.color} foil />
          )}
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
