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
        sans: ["Poppins", "system-ui", "sans-serif"],
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
        "float-mobile": "floatMobile 4s ease-in-out infinite",
        "float-logo":   "floatLogo 7s ease-in-out infinite",
        "balloon-burst-a": "balloonBurstA var(--burst-dur, 2.2s) var(--burst-ease, ease-out) var(--burst-delay, 0s) forwards",
        "balloon-burst-b": "balloonBurstB var(--burst-dur, 2.35s) var(--burst-ease, ease-out) var(--burst-delay, 0s) forwards",
        "confetti-burst-a":"confettiBurstA var(--fall-dur, 1.9s) var(--fall-ease, ease-out) var(--fall-delay, 0s) forwards",
        "confetti-burst-b":"confettiBurstB var(--fall-dur, 2s) var(--fall-ease, ease-out) var(--fall-delay, 0s) forwards",
        "balloon-rise-a": "balloonRiseA var(--rise-dur, 2.8s) var(--rise-ease, ease-out) var(--rise-delay, 0s) forwards",
        "balloon-rise-b": "balloonRiseB var(--rise-dur, 2.9s) var(--rise-ease, ease-out) var(--rise-delay, 0s) forwards",
        "balloon-rise-c": "balloonRiseC var(--rise-dur, 3.1s) var(--rise-ease, ease-out) var(--rise-delay, 0s) forwards",
        "confetti-fall-a":"confettiFallA var(--fall-dur, 3s) var(--fall-ease, ease-in) var(--fall-delay, 0s) forwards",
        "confetti-fall-b":"confettiFallB var(--fall-dur, 3.2s) var(--fall-ease, ease-in) var(--fall-delay, 0s) forwards",
        "pop":          "pop 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both",
        "bounce-in":    "bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "foil-sweep":   "foilSweep 2s ease-in-out infinite",
        "banner-in":    "bannerIn 0.32s cubic-bezier(0.22,0.78,0.16,1) both",
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
        floatMobile: {
          "0%, 100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%":      { transform: "translateY(-4px) rotate(1deg)" },
        },
        floatLogo: {
          "0%, 100%": { transform: "translateY(3px)" },
          "50%":      { transform: "translateY(-3px)" },
        },
        balloonBurstA: {
          "0%":   { transform: "translate3d(-50%, -50%, 0) scale(0.3) rotate(var(--rot-start, 0deg))", opacity: "0" },
          "12%":  { opacity: "1" },
          "100%": { transform: "translate3d(calc(-50% + var(--burst-x, 0px)), calc(-50% + var(--burst-y, 0px)), 0) scale(1) rotate(var(--rot-end, 0deg))", opacity: "0" },
        },
        balloonBurstB: {
          "0%":   { transform: "translate3d(-50%, -50%, 0) scale(0.24) rotate(var(--rot-start, 0deg))", opacity: "0" },
          "10%":  { opacity: "1" },
          "100%": { transform: "translate3d(calc(-50% + var(--burst-x, 0px)), calc(-50% + var(--burst-y, 0px)), 0) scale(0.92) rotate(var(--rot-end, 0deg))", opacity: "0" },
        },
        confettiBurstA: {
          "0%":   { transform: "translate3d(-50%, -50%, 0) scale(0.2) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate3d(calc(-50% + var(--burst-x, 0px)), calc(-50% + var(--burst-y, 0px)), 0) scale(1) rotate(720deg)", opacity: "0" },
        },
        confettiBurstB: {
          "0%":   { transform: "translate3d(-50%, -50%, 0) scale(0.2) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate3d(calc(-50% + var(--burst-x, 0px)), calc(-50% + var(--burst-y, 0px)), 0) scale(0.95) rotate(-620deg)", opacity: "0" },
        },
        balloonRiseA: {
          "0%":   { transform: "translate3d(var(--x-start, 0px), 0, 0) rotate(var(--rot-start, 0deg))", opacity: "0" },
          "8%":   { opacity: "1" },
          "35%":  { transform: "translate3d(calc(var(--x-mid, 0px) * 0.55), -35vh, 0) rotate(calc(var(--rot-mid, 0deg) * 0.75))" },
          "62%":  { transform: "translate3d(var(--x-mid, 0px), -70vh, 0) rotate(var(--rot-mid, 0deg))" },
          "88%":  { opacity: "1" },
          "100%": { transform: "translate3d(var(--x-end, 0px), -115vh, 0) rotate(var(--rot-end, 0deg))", opacity: "0" },
        },
        balloonRiseB: {
          "0%":   { transform: "translate3d(var(--x-start, 0px), 0, 0) rotate(var(--rot-start, 0deg))", opacity: "0" },
          "8%":   { opacity: "1" },
          "25%":  { transform: "translate3d(calc(var(--x-mid, 0px) * 0.4), -28vh, 0) rotate(calc(var(--rot-mid, 0deg) * 0.6))" },
          "55%":  { transform: "translate3d(calc(var(--x-mid, 0px) * 1.1), -64vh, 0) rotate(var(--rot-mid, 0deg))" },
          "78%":  { transform: "translate3d(calc(var(--x-end, 0px) * 0.85), -89vh, 0) rotate(calc(var(--rot-end, 0deg) * 0.8))" },
          "100%": { transform: "translate3d(var(--x-end, 0px), -115vh, 0) rotate(var(--rot-end, 0deg))", opacity: "0" },
        },
        balloonRiseC: {
          "0%":   { transform: "translate3d(var(--x-start, 0px), 0, 0) rotate(var(--rot-start, 0deg))", opacity: "0" },
          "8%":   { opacity: "1" },
          "30%":  { transform: "translate3d(calc(var(--x-mid, 0px) * -0.35), -34vh, 0) rotate(calc(var(--rot-mid, 0deg) * -0.55))" },
          "60%":  { transform: "translate3d(calc(var(--x-mid, 0px) * 0.9), -69vh, 0) rotate(var(--rot-mid, 0deg))" },
          "86%":  { opacity: "1" },
          "100%": { transform: "translate3d(var(--x-end, 0px), -115vh, 0) rotate(var(--rot-end, 0deg))", opacity: "0" },
        },
        confettiFallA: {
          "0%":   { transform: "translateY(0) rotate(0deg)",    opacity: "1" },
          "45%":  { transform: "translate3d(var(--confetti-drift, 0px), 48vh, 0) rotate(360deg)", opacity: "0.95" },
          "100%": { transform: "translate3d(calc(var(--confetti-drift, 0px) * 1.4), 110vh, 0) rotate(720deg)", opacity: "0" },
        },
        confettiFallB: {
          "0%":   { transform: "translateY(0) rotate(0deg)",    opacity: "1" },
          "35%":  { transform: "translate3d(calc(var(--confetti-drift, 0px) * -0.7), 36vh, 0) rotate(260deg)", opacity: "0.95" },
          "72%":  { transform: "translate3d(var(--confetti-drift, 0px), 78vh, 0) rotate(560deg)", opacity: "0.75" },
          "100%": { transform: "translate3d(calc(var(--confetti-drift, 0px) * 1.15), 110vh, 0) rotate(780deg)", opacity: "0" },
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
        bannerIn: {
          "0%":   { opacity: "0", transform: "translateY(-10px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
