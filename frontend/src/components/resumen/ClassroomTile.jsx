const STATUS_STYLES = {
  operational: {
    container: "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20",
    icon: "door_front",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    container: "border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 ring-4 ring-amber-500/10 animate-pulse",
    icon: "warning",
    text: "text-amber-700 dark:text-amber-400",
  },
};

export default function ClassroomTile({ classroom }) {
  const style = STATUS_STYLES[classroom.status];
  return (
    <button type="button" className={`flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border-2 transition-all ${style.container}`}>
      <span className={`material-symbols-outlined ${style.text}`}>{style.icon}</span>
      <span className={`text-center font-bold ${style.text}`}>
        {classroom.name}{classroom.detail ? ` (${classroom.detail})` : ""}
      </span>
    </button>
  );
}
