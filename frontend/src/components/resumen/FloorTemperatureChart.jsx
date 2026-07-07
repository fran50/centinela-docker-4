export default function FloorTemperatureChart() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-6 text-lg font-bold">Temperatura por planta</h3>
      <div className="relative flex h-64 items-center justify-center">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 200" role="img" aria-label="Evolución de temperatura por planta">
          <path d="M0,150 C50,140 100,160 150,145 S250,120 300,130 S350,110 400,100" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
          <path d="M0,180 C50,170 100,175 150,160 S250,155 300,150 S350,140 400,145" fill="none" stroke="currentColor" strokeDasharray="4" strokeWidth="3" className="text-slate-400" />
        </svg>
        <div className="absolute bottom-0 flex w-full justify-between px-2 text-[10px] text-slate-400">
          <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span>
        </div>
        <div className="absolute right-0 top-0 flex flex-col gap-1 text-xs">
          <span className="flex items-center gap-2"><span className="h-1 w-3 rounded-full bg-primary" />Planta 1</span>
          <span className="flex items-center gap-2"><span className="h-1 w-3 rounded-full bg-slate-400" />Planta 0</span>
        </div>
      </div>
    </article>
  );
}
