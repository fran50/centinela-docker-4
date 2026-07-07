const STATUS_STYLES = {
  live: "bg-emerald-100 text-emerald-700 border-emerald-200",
  demo: "bg-blue-100 text-blue-700 border-blue-200",
  connecting: "bg-amber-100 text-amber-700 border-amber-200",
  offline: "bg-slate-100 text-slate-600 border-slate-200",
  error: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS = {
  live: "En vivo",
  demo: "Demo",
  connecting: "Conectando",
  offline: "Reconectando",
  error: "Error",
};

export default function LiveBadge({ status = "demo", className = "" }) {
  const isActive = status === "live" || status === "demo";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[status] ?? STATUS_STYLES.offline} ${className}`}>
      <span className="relative flex h-2 w-2">
        {isActive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {STATUS_LABELS[status] ?? "Sin estado"}
    </span>
  );
}
