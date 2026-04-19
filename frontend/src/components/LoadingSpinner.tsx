interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClass = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" }[size];
  return (
    <div
      className={`${sizeClass} rounded-full border-2 animate-spin ${className}`}
      style={{
        borderColor: "#E8D9C8",
        borderTopColor: "#6A1B9A",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}
