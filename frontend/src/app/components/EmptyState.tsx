/**
 * EmptyState — a consistent empty/zero-state component used across list views.
 */
interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = "✨", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
      <span className="text-4xl">{emoji}</span>
      <h3 className="text-base font-semibold text-white/80">{title}</h3>
      {description && <p className="text-sm text-white/40 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
