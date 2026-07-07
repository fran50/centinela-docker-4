import { formatMetric } from "../../utils/meteo";

export default function GaugeCard({ title, value, previousValue, min = 0, max = 100, unit = "%", label, tone = "text-primary" }) {
  const safeValue = value === null ? min : Math.max(min, Math.min(max, value));
  const percent = ((safeValue - min) / (max - min || 1)) * 100;
  const dashArray = 251.2;
  const dashOffset = dashArray - (dashArray * percent) / 100;
  const hasChanged = value !== previousValue;

  return (
    <article className={`metric-card flex flex-col items-center justify-center ${hasChanged ? "metric-card-updated" : ""}`}>
      <h3 className="self-start text-sm font-bold text-on-surface">{title}</h3>
      <div className="relative mt-4 h-40 w-40">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="9" className="text-slate-100" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            className={`${tone} transition-all duration-700 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-on-surface">{formatMetric(value, 0)}</span>
          <span className="text-sm font-semibold text-secondary">{unit}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-on-surface-variant">{label}</p>
      <div className="mt-3 flex w-full justify-between text-xs font-semibold text-secondary">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </article>
  );
}
