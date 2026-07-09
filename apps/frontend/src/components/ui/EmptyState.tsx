interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-mist-dark bg-paper/50 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
    </div>
  );
}