import { changed, formatMetric, getDelta } from "../../utils/meteo";

const toneClasses = {
  blue: "bg-blue-50 text-primary ring-blue-100",
  red: "bg-red-50 text-error ring-red-100",
  green: "bg-emerald-50 text-tertiary ring-emerald-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  slate: "bg-slate-50 text-slate-600 ring-slate-100",
};

export default function MetricCard({
  title,
  icon,
  value,
  previousValue,
  unit = "",
  decimals = 1,
  subtitle,
  tone = "blue",
  children,
  fallback = "Sin lectura",
}) {
  const hasChanged = changed(value, previousValue);
  const delta = getDelta(value, previousValue);

  return (
    <article className={`metric-card group ${hasChanged ? "metric-card-updated" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone] ?? toneClasses.blue}`}>
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        {hasChanged && <span className="update-dot" aria-label="Valor actualizado" />}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-secondary">{title}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
            {formatMetric(value, decimals, fallback)}
          </span>
          {unit && value !== null && <span className="text-sm font-semibold text-secondary">{unit}</span>}
          {delta !== null && Math.abs(delta) > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${delta > 0 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
              {delta > 0 ? "+" : ""}{formatMetric(delta, 1, "0")}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-xs font-medium text-on-surface-variant">{subtitle}</p>}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </article>
  );
}
