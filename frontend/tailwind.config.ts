import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lukso: {
          pink:    "#FE005B",       // kept for primary CTAs / alerts
          purple:  "#9B6FD0",       // balloon lavender — main accent
          cream:   "#F5E2C0",       // logo text colour
          dark:    "#1E1245",       // deep purple background (logo BG)
          card:    "#2A1860",       // card surface
          border:  "#3D2880",       // subtle border
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":      "fadeIn 0.2s ease-out",
        "slide-up":     "slideUp 0.25s ease-out",
        "float":        "float 3s ease-in-out infinite",
        "float-slow":   "float 4.5s ease-in-out infinite",
        "balloon-rise": "balloonRise var(--rise-dur, 2.8s) ease-out var(--rise-delay, 0s) forwards",
        "confetti-fall":"confettiFall var(--fall-dur, 3s) ease-in var(--fall-delay, 0s) forwards",
        "pop":          "pop 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both",
        "bounce-in":    "bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
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
      },
    },
  },
  plugins: [],
} satisfies Config;
