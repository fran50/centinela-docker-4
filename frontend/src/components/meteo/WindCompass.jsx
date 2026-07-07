import { formatMetric } from "../../utils/meteo";

export default function WindCompass({ reading, previousReading }) {
  const hasChanged = reading.windDegrees !== previousReading?.windDegrees || reading.windSpeed !== previousReading?.windSpeed;
  const degrees = reading.windDegrees ?? 0;

  return (
    <article className={`metric-card ${hasChanged ? "metric-card-updated" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-on-surface">Viento actual</p>
          <p className="mt-3 text-3xl font-black text-on-surface">
            {formatMetric(reading.windSpeed, 1)} <span className="text-base font-semibold text-secondary">km/h</span>
          </p>
          <p className="mt-1 text-xs font-medium text-on-surface-variant">Ráfagas: {formatMetric(reading.windGusts, 2)} km/h</p>
        </div>

        <div className="relative h-36 w-36 shrink-0 rounded-full border-4 border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-inner">
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-xs font-black text-secondary">N</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-black text-secondary">S</span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-secondary">O</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-secondary">E</span>
          <span
            className="material-symbols-outlined absolute left-1/2 top-1/2 text-5xl text-primary transition-transform duration-700 ease-out"
            style={{ transform: `translate(-50%, -50%) rotate(${degrees}deg)` }}
          >
            near_me
          </span>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-16 text-center">
            <span className="text-2xl font-black text-on-surface">{reading.windDirection}</span>
            <span className="text-xs font-bold text-secondary">{formatMetric(reading.windDegrees, 0)}°</span>
          </div>
        </div>
      </div>
    </article>
  );
}
