export default function OccupancyChart({ data }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-6 text-lg font-bold">Ocupación por horas</h3>
      <div className="flex h-64 items-end justify-between gap-2 px-2 pb-6">
        {data.map((item) => (
          <div key={item.label} className="group relative flex h-full flex-1 items-end rounded-t-lg bg-slate-100 dark:bg-slate-800">
            <div
              className="w-full rounded-t-lg bg-primary/40 transition-colors group-hover:bg-primary"
              style={{ height: `${item.value}%` }}
              title={`${item.value}% de ocupación`}
            />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase text-slate-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
