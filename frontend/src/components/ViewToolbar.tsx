/**
 * ViewToolbar — shared top-nav bar for all secondary views.
 * Provides a consistent back arrow, centered title, and optional right slot.
 * Uses light-mode colors that are always visible on the cream background.
 */
import type { ReactNode } from "react";

interface ViewToolbarProps {
  /** Left: back arrow + label */
  onBack: () => void;
  backLabel?: string;
  /** Center */
  title?: ReactNode;
  /** Right slot (e.g. LanguageToggle, action button) */
  right?: ReactNode;
  className?: string;
}

export function ViewToolbar({
  onBack,
  backLabel = "Inicio",
  title,
  right,
  className = "",
}: ViewToolbarProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 pt-4 pb-3 border-b shrink-0 ${className}`}
      style={{ borderColor: "#E8D9C8" }}
    >
      {/* Back button — always visible on cream bg */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium shrink-0 transition-colors"
        style={{ color: "#6A1B9A" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9C4EDB")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#6A1B9A")}
      >
        {/* Arrow */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="max-[380px]:hidden">{backLabel}</span>
      </button>

      {/* Title */}
      {title && (
        <span
          className="title-premium text-xs sm:text-sm truncate mx-2 sm:mx-3 text-center flex-1 min-w-0"
          style={{ color: "#2C2C2C" }}
        >
          {title}
        </span>
      )}
      {!title && <span className="flex-1" />}

      {/* Right slot */}
      <div className="shrink-0">{right ?? <span className="w-14" />}</div>
    </div>
  );
}
