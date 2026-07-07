import FloorTemperatureChart from "./FloorTemperatureChart";
import OccupancyChart from "./OccupancyChart";

export default function OverviewCharts({ occupancy }) {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <OccupancyChart data={occupancy} />
      <FloorTemperatureChart />
    </section>
  );
}
