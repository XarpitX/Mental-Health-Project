export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-mc-card/40 px-8 py-16 text-center">
      <div className="mb-4 text-4xl opacity-40">◇</div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-mc-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
