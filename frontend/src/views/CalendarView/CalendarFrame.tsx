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
    <div className="relative flex-1 overflow-hidden">
      {/* Decorative balloon frame background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{
          backgroundImage: `url('/balloon-frame.png')`,
          backgroundPosition: "center 30%",
          backgroundSize: "150% 150%",
          // Subtle 3D depth effect - slightly transparent
          opacity: isLoading ? 0.4 : 0.75,
        }}
      />

      {/* Gradient overlay for depth and text contrast */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)",
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
