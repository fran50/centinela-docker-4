export default function StatusTile({ icon, title, active, activeLabel = "Sí", inactiveLabel = "No" }) {
  return (
    <div className="rounded-2xl border border-outline bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-3xl ${active ? "text-blue-600" : "text-slate-400"}`}>{icon}</span>
        <div>
          <p className="text-xs font-bold text-secondary">{title}</p>
          <p className={`text-2xl font-black ${active ? "text-blue-600" : "text-emerald-600"}`}>{active ? activeLabel : inactiveLabel}</p>
        </div>
      </div>
    </div>
  );
}
