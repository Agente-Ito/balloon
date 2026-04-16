/**
 * BalloonBurst — full-screen celebration overlay.
 *
 * Triggered via useAppStore.triggerBurst(). Renders balloons that rise
 * from the bottom and confetti that falls from the top, then self-clears.
 * Pointer-events: none so it never blocks interaction.
 */
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BalloonIcon } from "./BalloonIcon";

const BALLOON_COLORS = [
  "#FE005B", // lukso pink
  "#8B5CF6", // lukso purple
  "#FFD700", // gold
  "#00C9FF", // sky blue
  "#FF6B6B", // coral
  "#A8E6CF", // mint
  "#FFB347", // orange
];

const CONFETTI_COLORS = [
  "#FE005B", "#8B5CF6", "#FFD700",
  "#FF6B6B", "#00C9FF", "#FFFFFF", "#A8E6CF",
];

interface BalloonParticle {
  id: number;
  left: number;   // 0-100 %
  color: string;
  delay: number;  // seconds
  duration: number;
  size: number;
}

interface ConfettiParticle {
  id: number;
  left: number;
  top: number;    // starting top offset px
  color: string;
  delay: number;
  duration: number;
  size: number;
  isRect: boolean;
}

function generateParticles() {
  const balloons: BalloonParticle[] = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    left: 4 + Math.random() * 92,
    color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    delay: Math.random() * 0.7,
    duration: 2.3 + Math.random() * 1.2,
    size: 28 + Math.random() * 22,
  }));

  const confetti: ConfettiParticle[] = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: -10 - Math.random() * 30,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 1.8,
    duration: 2.2 + Math.random() * 1.8,
    size: 5 + Math.random() * 8,
    isRect: Math.random() > 0.45,
  }));

  return { balloons, confetti };
}

export function BalloonBurst() {
  const { burstActive, clearBurst } = useAppStore();
  const [particles, setParticles] = useState<{ balloons: BalloonParticle[]; confetti: ConfettiParticle[] } | null>(null);

  useEffect(() => {
    if (!burstActive) return;

    setParticles(generateParticles());
    const timer = setTimeout(clearBurst, 4200);
    return () => clearTimeout(timer);
  }, [burstActive, clearBurst]);

  if (!burstActive || !particles) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      {/* Balloons rising from bottom */}
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
          <BalloonIcon size={b.size} color={b.color} />
        </div>
      ))}

      {/* Confetti falling from top */}
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
            opacity: 0.9,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
