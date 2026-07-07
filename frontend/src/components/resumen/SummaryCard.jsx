export default function SummaryCard({ card }) {
  return (
    <article className="flex min-h-44 flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium uppercase tracking-tight text-slate-500 dark:text-slate-400">
          {card.title}
        </p>
        <span className={`material-symbols-outlined rounded-lg p-2 ${card.iconClass}`}>
          {card.icon}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold">
        {card.value}
        {card.suffix && (
          <span className={`ml-2 text-lg font-medium text-slate-400 ${card.suffixClass ?? ""}`}>
            {card.suffix}
          </span>
        )}
      </p>

      {typeof card.progress === "number" ? (
        <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${card.progress}%` }} />
        </div>
      ) : (
        <div className={`mt-4 flex items-center gap-1 text-sm ${card.detailClass ?? "text-slate-400"}`}>
          {card.detailIcon && <span className="material-symbols-outlined text-sm">{card.detailIcon}</span>}
          <span>{card.detail}</span>
        </div>
      )}
    </article>
  );
}
