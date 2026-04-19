import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light-mode balloon foil palette
        cel: {
          violet:  "#6A1B9A",  // primary — metallic violet foil
          accent:  "#9C4EDB",  // highlight / lighter violet
          cream:   "#F5F0E1",  // main background
          beige:   "#E8D9C8",  // secondary / borders
          text:    "#2C2C2C",  // body text
          muted:   "#8B7D7D",  // muted/secondary text
          white:   "#FFFFFF",  // text on violet backgrounds
          card:    "#FFFFFF",  // card surface
          success: "#2E7D32",  // success states
        },
        // Keep lukso.* remapped to light-mode equivalents so legacy classes still work
        lukso: {
          pink:   "#6A1B9A",  // was hot pink → now primary violet (main CTAs)
          purple: "#9C4EDB",  // was lavender → now accent violet
          cream:  "#F5F0E1",  // was logo cream → now bg cream
          dark:   "#F5F0E1",  // was deep bg → now cream background
          card:   "#FFFFFF",  // was dark card → now white card
          border: "#E8D9C8",  // was dark border → now beige border
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "foil":       "0 2px 12px 0 rgba(106,27,154,0.18), inset 0 1px 0 rgba(255,255,255,0.35)",
        "foil-hover": "0 4px 20px 0 rgba(106,27,154,0.32), inset 0 1px 0 rgba(255,255,255,0.45)",
        "card":       "0 1px 4px 0 rgba(44,44,44,0.06), 0 4px 16px 0 rgba(106,27,154,0.08)",
        "card-hover": "0 2px 8px 0 rgba(44,44,44,0.08), 0 8px 24px 0 rgba(106,27,154,0.14)",
      },
      backgroundImage: {
        "foil-btn":     "linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 38%, #8E24AA 62%, #6A1B9A 100%)",
        "foil-success": "linear-gradient(135deg, #6A1B9A 0%, #9C4EDB 50%, #6A1B9A 100%)",
        "foil-shine":   "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
      },
      animation: {
        "fade-in":      "fadeIn 0.2s ease-out",
        "slide-up":     "slideUp 0.25s ease-out",
        "float":        "float 3s ease-in-out infinite",
        "float-slow":   "float 4.5s ease-in-out infinite",
        "float-logo":   "floatLogo 7s ease-in-out infinite",
        "balloon-rise": "balloonRise var(--rise-dur, 2.8s) ease-out var(--rise-delay, 0s) forwards",
        "confetti-fall":"confettiFall var(--fall-dur, 3s) ease-in var(--fall-delay, 0s) forwards",
        "pop":          "pop 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both",
        "bounce-in":    "bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "foil-sweep":   "foilSweep 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%":      { transform: "translateY(-7px) rotate(2deg)" },
        },
        floatLogo: {
          "0%, 100%": { transform: "translateY(3px)" },
          "50%":      { transform: "translateY(-3px)" },
        },
        balloonRise: {
          "0%":   { transform: "translateY(0)",      opacity: "0" },
          "8%":   { opacity: "1" },
          "88%":  { opacity: "1" },
          "100%": { transform: "translateY(-115vh)", opacity: "0" },
        },
        confettiFall: {
          "0%":   { transform: "translateY(0) rotate(0deg)",    opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
        pop: {
          "0%":   { transform: "scale(1)" },
          "40%":  { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        bounceIn: {
          "0%":   { transform: "scale(0.6)", opacity: "0" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
        foilSweep: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
