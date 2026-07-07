import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function ChartCard({ title, children }) {
  return (
    <article className="rounded-2xl border border-outline bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-on-surface sm:text-base">{title}</h3>
      </div>
      {children}
    </article>
  );
}

const tooltipStyle = {
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
};

export function TemperatureHistoryChart({ history, status }) {
  const data = history.map((point) => ({
    time: point.shortLabel,
    exterior: point.temperature,
    interior: point.indoorTemperature,
    sensacion: point.thermalSensation,
  }));

  return (
    <ChartCard title="Evolución de temperatura (ºC)" status={status}>
      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="exteriorFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#135bec" stopOpacity={0.22}/><stop offset="95%" stopColor="#135bec" stopOpacity={0}/></linearGradient>
              <linearGradient id="interiorFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.18}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
              <linearGradient id="sensacionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.14}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#475569" }} minTickGap={22} />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} domain={[0, "dataMax + 5"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="exterior" name="Exterior" stroke="#135bec" fill="url(#exteriorFill)" strokeWidth={3} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="interior" name="Interior" stroke="#ef4444" fill="url(#interiorFill)" strokeWidth={3} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="sensacion" name="Sensación" stroke="#10b981" fill="url(#sensacionFill)" strokeWidth={3} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function RainChart({ reading, status }) {
  const data = [
    { name: "Hoy", mm: reading.rainToday ?? 0 },
    { name: "24h", mm: reading.rain24h ?? 0 },
    { name: "Mes", mm: reading.monthRain ?? 0 },
    { name: "Año", mm: reading.yearRain ?? 0 },
  ];

  return (
    <ChartCard title="Precipitaciones" status={status}>
      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} mm`, "Precipitación"]} />
            <Bar dataKey="mm" radius={[8, 8, 0, 0]} fill="#3b82f6" label={{ position: "top", fontSize: 12, fontWeight: 700, fill: "#0f172a" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function MinMaxChart({ reading }) {
  const data = [
    { name: "Día", max: reading.dayMax, min: reading.dayMin },
    { name: "Mes", max: reading.monthMax, min: reading.monthMin },
    { name: "Año", max: reading.yearMax, min: reading.yearMin },
  ];

  return (
    <article className="rounded-2xl border border-outline bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-black text-on-surface sm:text-base">Máximas y mínimas</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} ºC`, ""]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="max" name="Máxima" fill="#ef4444" radius={[8, 8, 0, 0]} />
            <Bar dataKey="min" name="Mínima" fill="#135bec" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
