import React from "react";

interface CalendarFrameProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

/**
 * Wraps the calendar grid with a decorative balloon frame background.
 * Uses a foil balloon image as the visual frame, with the calendar content
 * positioned inside with responsive padding.
 * 
 * Adapts to mobile (portrait, full-width) and desktop (landscape) viewports.
 */
export function CalendarFrame({ children, isLoading }: CalendarFrameProps) {
  return (
    <div className="relative flex-1 overflow-hidden" style={{ backgroundColor: "#F5F0E1" }}>
      {/* Pure-CSS foil balloon pillow — replaces balloon-frame.png */}
      <div
        className="absolute pointer-events-none z-0 transition-opacity duration-500"
        style={{
          // Inset margin reveals the cream background at the edges, giving a
          // "floating square balloon pillow" look
          inset: "clamp(8px, 3vw, 28px)",
          borderRadius: "clamp(26px, 8vw, 70px)",
          opacity: isLoading ? 0.42 : 1,
          // Layered radial gradients: foil body + specular + sheen + rim vignette
          backgroundImage: [
            // Rim vignette — darkens edges for 3D balloon volume
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 46%, rgba(28,0,52,0.38) 100%)",
            // Lower-right secondary reflection (warm magenta bounce light)
            "radial-gradient(ellipse 55% 52% at 75% 77%, rgba(214,148,255,0.30) 0%, transparent 100%)",
            // Upper-left primary specular gloss highlight
            "radial-gradient(ellipse 68% 50% at 27% 21%, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.14) 44%, transparent 100%)",
            // Main balloon foil body: rich purple with magenta undertones
            "radial-gradient(ellipse 96% 92% at 34% 27%, #D49EEE 0%, #AB52D8 14%, #8A26BC 36%, #7118A8 60%, #560D90 80%, #3C0474 100%)",
          ].join(", "),
          // Puffy balloon shadow + inset seam highlights (simulates inflated edge)
          boxShadow: [
            "0 20px 58px rgba(56,0,92,0.46)",          // ambient drop shadow
            "0 4px 14px rgba(56,0,92,0.24)",            // tight drop shadow
            "inset 0 4px 8px rgba(228,172,255,0.42)",  // bright seam top edge
            "inset 0 -6px 13px rgba(16,0,38,0.34)",    // deep seam bottom edge
            "inset 5px 0 10px rgba(220,148,255,0.22)", // left inner shimmer
            "inset -5px 0 10px rgba(16,0,38,0.22)",    // right inner shadow
          ].join(", "),
          // The foil seam: subtle lighter outer border
          border: "2.5px solid rgba(198,130,244,0.50)",
        }}
      />

      {/* Depth overlay — soft vignette for text contrast */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.14) 100%)",
        }}
      />

      {/* Calendar content wrapper - positioned inside the frame */}
      <div
        className="relative z-10 h-full flex flex-col"
        style={{
          // Responsive padding that adapts from mobile to desktop
          // Uses clamp to create smooth transitions
          paddingTop: "clamp(1.5rem, 8vw, 3rem)",
          paddingBottom: "clamp(1.5rem, 8vw, 2.5rem)",
          paddingLeft: "clamp(1.25rem, 6vw, 3rem)",
          paddingRight: "clamp(1.25rem, 6vw, 3rem)",
        }}
      >
        {/* Content container with scroll */}
        <div className="h-full flex flex-col overflow-hidden">
          {children}
        </div>
      </div>

      {/* Subtle inner glow for polish */}
      <div
        className="absolute inset-0 pointer-events-none z-[2] rounded-full"
        style={{
          background: "radial-gradient(circle 800px at 50% 0, rgba(156, 78, 219, 0.1) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
