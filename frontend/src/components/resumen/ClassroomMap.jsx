import ClassroomTile from "./ClassroomTile";

function Floor({ number, classrooms }) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Planta {number}</h4>
      <div className="grid grid-cols-3 gap-3">
        {classrooms.map((classroom) => <ClassroomTile key={classroom.name} classroom={classroom} />)}
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${color}`} /><span className="text-sm text-slate-500 dark:text-slate-400">{label}</span></span>;
}

export default function ClassroomMap({ classrooms }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-8">
        <h3 className="text-lg font-bold">Mapa de planta interactiva</h3>
        <p className="text-sm text-slate-400">Estado real de aulas por planta</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Floor number={0} classrooms={classrooms.filter((item) => item.floor === 0)} />
        <Floor number={1} classrooms={classrooms.filter((item) => item.floor === 1)} />
      </div>

      <div className="mt-8 flex flex-wrap gap-6 border-t border-slate-100 pt-6 dark:border-slate-800">
        <LegendItem color="bg-emerald-500" label="Operativo" />
        <LegendItem color="bg-amber-500" label="Aviso / mantenimiento" />
        <LegendItem color="bg-red-500" label="Alerta crítica" />
      </div>
    </section>
  );
}
