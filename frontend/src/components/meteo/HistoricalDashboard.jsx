import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMetric } from "../../utils/meteo";

const tooltipStyle = {
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  boxShadow: "0 14px 30px rgba(15,23,42,.16)",
  background: "var(--tooltip-bg, #fff)",
};

function Card({ children, className = "" }) {
  return <article className={`rounded-2xl border border-outline bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}>{children}</article>;
}

function SummaryCard({ icon, label, value, unit = "", footer }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined rounded-xl bg-blue-50 p-2 text-primary dark:bg-blue-950/50">{icon}</span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-wider text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-black text-on-surface dark:text-white">{value}<span className="ml-1 text-sm font-bold text-secondary">{unit}</span></p>
          <p className="mt-1 text-xs font-semibold text-secondary">{footer}</p>
        </div>
      </div>
    </Card>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <Card className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-black text-on-surface dark:text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-secondary">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </Card>
  );
}

function axisTick() {
  return { fontSize: 10, fill: "#64748b" };
}

export default function HistoricalDashboard({ reading, history, meta }) {
  const data = history.map((point) => ({
    time: point.shortLabel,
    exterior: point.temperature,
    interior: point.indoorTemperature,
    humedad: point.humidity,
    presion: point.pressure,
    viento: point.windSpeed,
    rafaga: point.windGusts,
    uv: point.uvIndex,
    visibilidad: point.visibility,
    densidad: point.density,
    lluvia: point.rainInterval ?? 0,
    acumulado: point.rainAccumulated ?? 0,
  }));

  const stats = meta?.stats ?? {};
  const number = (value, decimals = 1) => formatMetric(value, decimals);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <SummaryCard icon="thermometer" label="Temperatura ext. media" value={number(reading.temperature)} unit="ºC" footer={`Mín ${number(stats.tempMin)} · Máx ${number(stats.tempMax)}`} />
        <SummaryCard icon="device_thermostat" label="Temperatura int. media" value={number(reading.indoorTemperature)} unit="ºC" footer={`Mín ${number(stats.indoorMin)} · Máx ${number(stats.indoorMax)}`} />
        <SummaryCard icon="humidity_low" label="Humedad media" value={number(reading.humidity, 0)} unit="%" footer={`Mín ${number(stats.humidityMin, 0)} · Máx ${number(stats.humidityMax, 0)}`} />
        <SummaryCard icon="speed" label="Presión media" value={number(reading.pressure, 1)} unit="hPa" footer={`Mín ${number(stats.pressureMin, 1)} · Máx ${number(stats.pressureMax, 1)}`} />
        <SummaryCard icon="rainy" label="Precipitación total" value={number(stats.totalRain, 1)} unit="mm" footer={`${number(stats.rainHours, 1)} h con lluvia`} />
        <SummaryCard icon="air" label="Velocidad media" value={number(reading.windSpeed, 1)} unit="km/h" footer={`Máx ${number(stats.windMax, 1)} km/h`} />
        <SummaryCard icon="storm" label="Ráfaga máxima" value={number(stats.gustMax, 1)} unit="km/h" footer={stats.gustMaxLabel ?? "Periodo seleccionado"} />
        <SummaryCard icon="wb_sunny" label="Índice UV medio" value={number(reading.uvIndex, 1)} footer={`Máx ${number(stats.uvMax, 1)}`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Temperatura (ºC)" subtitle="Exterior e interior durante todo el intervalo">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415533" /><XAxis dataKey="time" tick={axisTick()} minTickGap={24}/><YAxis tick={axisTick()}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="exterior" name="Exterior" stroke="#2563eb" fill="#2563eb22" strokeWidth={2}/><Area type="monotone" dataKey="interior" name="Interior" stroke="#60a5fa" fill="#60a5fa15" strokeWidth={2} strokeDasharray="5 3"/>
          </AreaChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Precipitación" subtitle="Intensidad por intervalo y acumulado del periodo">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415533" /><XAxis dataKey="time" tick={axisTick()} minTickGap={24}/><YAxis yAxisId="left" tick={axisTick()}/><YAxis yAxisId="right" orientation="right" tick={axisTick()}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:11}}/>
            <Bar yAxisId="left" dataKey="lluvia" name="Intervalo (mm)" fill="#3b82f6" radius={[3,3,0,0]}/><Line yAxisId="right" type="stepAfter" dataKey="acumulado" name="Acumulado (mm)" stroke="#1d4ed8" strokeWidth={2} dot={false}/>
          </BarChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Humedad relativa (%)" subtitle="Variación de la humedad en el periodo">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#33415533"/><XAxis dataKey="time" tick={axisTick()} minTickGap={24}/><YAxis domain={[0,100]} tick={axisTick()}/><Tooltip contentStyle={tooltipStyle}/><Line type="monotone" dataKey="humedad" name="Humedad" stroke="#22c55e" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Presión atmosférica (hPa)" subtitle="Evolución y tendencia barométrica">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#33415533"/><XAxis dataKey="time" tick={axisTick()} minTickGap={24}/><YAxis domain={["dataMin - 3","dataMax + 3"]} tick={axisTick()}/><Tooltip contentStyle={tooltipStyle}/><Line type="monotone" dataKey="presion" name="Presión" stroke="#a855f7" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Viento (km/h)" subtitle="Velocidad media y ráfagas máximas">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#33415533"/><XAxis dataKey="time" tick={axisTick()} minTickGap={24}/><YAxis tick={axisTick()}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:11}}/><Line type="monotone" dataKey="viento" name="Velocidad" stroke="#2563eb" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="rafaga" name="Ráfaga" stroke="#a855f7" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Índice UV, visibilidad y densidad" subtitle="Tres variables ambientales comparadas">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#33415533"/><XAxis dataKey="time" tick={axisTick()} minTickGap={24}/><YAxis yAxisId="left" tick={axisTick()}/><YAxis yAxisId="right" orientation="right" tick={axisTick()}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:11}}/><Line yAxisId="left" type="monotone" dataKey="uv" name="Índice UV" stroke="#f59e0b" strokeWidth={2} dot={false}/><Line yAxisId="left" type="monotone" dataKey="visibilidad" name="Visibilidad (km)" stroke="#14b8a6" strokeWidth={2} dot={false}/><Line yAxisId="right" type="monotone" dataKey="densidad" name="Densidad (kg/m³)" stroke="#94a3b8" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard icon="device_thermostat" label="Máxima del periodo" value={number(stats.tempMax)} unit="ºC" footer={stats.tempMaxLabel ?? "—"}/>
        <SummaryCard icon="ac_unit" label="Mínima del periodo" value={number(stats.tempMin)} unit="ºC" footer={stats.tempMinLabel ?? "—"}/>
        <SummaryCard icon="rainy" label="Periodo con lluvia" value={number(stats.rainPercent, 1)} unit="%" footer={`${number(stats.rainHours, 1)} horas estimadas`}/>
        <SummaryCard icon="weather_snowy" label="Periodo con nieve" value={number(stats.snowPercent, 1)} unit="%" footer={stats.snowPercent > 0 ? "Eventos detectados" : "Sin eventos"}/>
        <SummaryCard icon="explore" label="Dirección predominante" value={`${reading.windDirection} (${number(reading.windDegrees, 0)}º)`} footer="Media circular aproximada"/>
        <SummaryCard icon="database" label="Cobertura de datos" value={number(stats.coverage, 1)} unit="%" footer={`${meta?.points ?? 0} puntos combinados`}/>
      </section>
    </div>
  );
}
