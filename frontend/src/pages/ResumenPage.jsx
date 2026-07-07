import ClassroomMap from "../components/resumen/ClassroomMap";
import OverviewCharts from "../components/resumen/OverviewCharts";
import SummaryGrid from "../components/resumen/SummaryGrid";
import { classrooms, occupancyByHour, summaryCards } from "../data/resumenData";

export default function ResumenPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Panel general</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Resumen del centro</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Indicadores principales de operación, ocupación, energía, confort y estado de las aulas.
        </p>
      </header>

      <SummaryGrid cards={summaryCards} />
      <OverviewCharts occupancy={occupancyByHour} />
      <ClassroomMap classrooms={classrooms} />
    </section>
  );
}
