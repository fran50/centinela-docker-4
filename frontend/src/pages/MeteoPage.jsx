import { useEffect, useMemo, useState } from "react";
import GaugeCard from "../components/meteo/GaugeCard";
import HistoricalDashboard from "../components/meteo/HistoricalDashboard";
import MetricCard from "../components/meteo/MetricCard";
import Sparkline from "../components/meteo/Sparkline";
import StatusTile from "../components/meteo/StatusTile";
import WindCompass from "../components/meteo/WindCompass";
import { MinMaxChart, RainChart, TemperatureHistoryChart } from "../components/meteo/WeatherCharts";
import useMeteoWebSocket from "../hooks/useMeteoWebSocket";
import useMeteoHistorical from "../hooks/useMeteoHistorical";
import { useAppStatus } from "../context/AppStatusContext";
import {
  formatMetric,
  getHumidityLabel,
  getIndoorStatus,
  getPressureTrendIcon,
} from "../utils/meteo";

const websocketUrl = import.meta.env.VITE_METEO_WS_URL;
const apiUrl = import.meta.env.VITE_METEO_API_URL ?? "http://localhost:3001";

function SectionHeader({ reading, error, mode, setMode, from, setFrom, to, setTo, resolution, setResolution, onConsult, loading, meta }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary ring-1 ring-blue-100"><span className="material-symbols-outlined text-3xl">cloud</span></div>
          <div><h1 className="text-2xl font-black tracking-tight text-on-surface dark:text-white sm:text-3xl">Meteo</h1><p className="mt-1 max-w-2xl text-sm text-on-surface-variant dark:text-slate-300">{mode === "real" ? "Monitorización meteorológica en tiempo real mediante WebSocket." : "Consulta histórica de datos meteorológicos mediante la API REST."}</p>{error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}</div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800"><button onClick={() => setMode("real")} className={`rounded-lg px-5 py-2 text-sm font-bold ${mode === "real" ? "bg-primary text-white shadow" : "text-secondary"}`}>Real</button><button onClick={() => setMode("historical")} className={`rounded-lg px-5 py-2 text-sm font-bold ${mode === "historical" ? "bg-primary text-white shadow" : "text-secondary"}`}>Histórico</button></div>
          <div className="rounded-2xl border border-outline bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-wider text-secondary">{mode === "real" ? "Última actualización" : "Periodo consultado"}</p><p className="mt-1 font-black text-on-surface dark:text-white">{mode === "real" ? reading.label : meta ? `${meta.from} → ${meta.to}` : "Selecciona un rango"}</p></div>
        </div>
      </div>
      {mode === "historical" && <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-outline bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <label className="text-xs font-bold text-secondary">Desde<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-outline bg-transparent px-3 py-2 text-sm text-on-surface dark:border-slate-600 dark:text-white"/></label>
        <label className="text-xs font-bold text-secondary">Hasta<input type="date" value={to} onChange={e => setTo(e.target.value)} className="mt-1 block rounded-lg border border-outline bg-transparent px-3 py-2 text-sm text-on-surface dark:border-slate-600 dark:text-white"/></label>
        <label className="text-xs font-bold text-secondary">Resolución<select value={resolution} onChange={e => setResolution(e.target.value)} className="mt-1 block rounded-lg border border-outline bg-transparent px-3 py-2 text-sm text-on-surface dark:border-slate-600 dark:text-white"><option value="auto">Automática</option><option value="raw">Original</option><option value="minuto">Minuto</option><option value="hora">Hora</option><option value="dia">Día</option></select></label>
        <button onClick={onConsult} disabled={loading} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><span className="material-symbols-outlined mr-2 align-middle text-base">search</span>{loading ? "Consultando…" : "Consultar"}</button>
      </div>}
    </div>
  );
}
function HeroPanel({ reading, previousReading }) {
  const indoorStatus = getIndoorStatus(reading.indoorTemperature);
  const rainingText = reading.isRaining ? "Lluvia activa" : "Sin lluvia";
  const snowText = reading.isSnowing ? "Nieve activa" : "Sin nieve";

  return (
    <section className="rounded-3xl border border-outline bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary">Estado del entorno</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
            {formatMetric(reading.temperature, 1)}º exterior
          </h2>
          <p className="mt-2 text-sm font-medium text-on-surface-variant">
            Sensación térmica {formatMetric(reading.thermalSensation, 1)}ºC · Interior {formatMetric(reading.indoorTemperature, 1)}ºC
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
            <p className="text-xs font-bold text-blue-700">Exterior</p>
            <p className="mt-1 text-3xl font-black text-blue-700">{formatMetric(reading.temperature, 1)}º</p>
            <p className="mt-1 text-xs font-semibold text-blue-700/75">
              ↑ {formatMetric(reading.dayMax, 1)}º · ↓ {formatMetric(reading.dayMin, 1)}º
            </p>
          </div>
          <div className={`rounded-2xl p-4 ring-1 ${indoorStatus.tone === "danger" ? "bg-red-50 text-red-700 ring-red-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"}`}>
            <p className="text-xs font-bold">Interior</p>
            <p className="mt-1 text-3xl font-black">{formatMetric(reading.indoorTemperature, 1)}º</p>
            <p className="mt-1 text-xs font-semibold">{indoorStatus.label}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700 ring-1 ring-emerald-100">
            <p className="text-xs font-bold">Estado</p>
            <p className="mt-1 text-xl font-black">{rainingText}</p>
            <p className="mt-1 text-xs font-semibold">{snowText}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 border-t border-outline pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Máx. mes" value={`${formatMetric(reading.monthMax, 1)} ºC`} icon="arrow_upward" tone="text-red-600" />
        <MiniStat label="Mín. mes" value={`${formatMetric(reading.monthMin, 1)} ºC`} icon="arrow_downward" tone="text-blue-600" />
        <MiniStat label="Máx. año" value={`${formatMetric(reading.yearMax, 1)} ºC`} icon="local_fire_department" tone="text-red-600" />
        <MiniStat label="Mín. año" value={`${formatMetric(reading.yearMin, 1)} ºC`} icon="ac_unit" tone="text-blue-600" />
      </div>
    </section>
  );
}

function MiniStat({ label, value, icon, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <span className={`material-symbols-outlined ${tone}`}>{icon}</span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">{label}</p>
        <p className="text-sm font-black text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function PressureCard({ reading, previousReading }) {
  const icon = getPressureTrendIcon(reading.pressureTrend);
  const pressureText = reading.pressure === null ? "Sin lectura" : `${formatMetric(reading.pressure, 0)} hPa`;

  return (
    <MetricCard
      title="Presión atmosférica"
      icon="speed"
      value={reading.pressure}
      previousValue={previousReading?.pressure}
      unit="hPa"
      decimals={0}
      tone="violet"
      fallback="Sin lectura"
      subtitle={pressureText}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
        <span>Tendencia: {reading.pressureTrend}</span>
        <span className="material-symbols-outlined text-base text-red-500">{icon}</span>
      </div>
    </MetricCard>
  );
}

function UvCard({ reading, previousReading }) {
  return (
    <MetricCard
      title="Índice UV"
      icon="wb_sunny"
      value={reading.uvIndex}
      previousValue={previousReading?.uvIndex}
      unit=""
      decimals={1}
      tone="violet"
      fallback="Sin lectura"
      subtitle={reading.uvIndex === null ? "No disponible" : "Lectura disponible"}
    />
  );
}

function AirDensityCard({ reading, previousReading }) {
  return (
    <MetricCard
      title="Densidad del aire"
      icon="eco"
      value={reading.density}
      previousValue={previousReading?.density}
      unit="kg/m³"
      decimals={2}
      tone="green"
      subtitle="Normal"
    />
  );
}

export default function MeteoPage() {
  const live = useMeteoWebSocket({ url: websocketUrl });
  const historical = useMeteoHistorical({ apiUrl });
  const { setStatus: setAppStatus, setDetail } = useAppStatus();
  const [mode, setMode] = useState("real");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultFrom = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }, []);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const [resolution, setResolution] = useState("auto");

  const source = mode === "real" ? live : historical;
  const reading = source.reading;
  const history = source.history;
  const previousReading = mode === "real" ? live.previousReading : history.at(-2) ?? null;
  const error = source.error;
  const status = mode === "real" ? live.status : historical.status;

  useEffect(() => {
    if (mode === "historical") {
      setAppStatus(historical.status === "error" ? "error" : "historical");
      setDetail(historical.meta ? `API REST · ${historical.meta.resolution} · ${historical.meta.points} puntos` : "Datos históricos mediante API REST");
    } else {
      setAppStatus(live.status);
      const details = { demo: "Sin VITE_METEO_WS_URL", connecting: "Abriendo WebSocket", live: "WebSocket conectado y recibiendo datos reales", offline: "WebSocket cerrado; reintentando", error: live.error ?? "Error de WebSocket" };
      setDetail(details[live.status] ?? "Estado del WebSocket");
    }
  }, [mode, live.status, live.error, historical.status, historical.meta, setAppStatus, setDetail]);

  const consult = () => historical.load({ from, to: `${to}T23:59:59`, resolution });

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 lg:p-8">
      <SectionHeader reading={reading} error={error} mode={mode} setMode={setMode} from={from} setFrom={setFrom} to={to} setTo={setTo} resolution={resolution} setResolution={setResolution} onConsult={consult} loading={historical.status === "loading"} meta={historical.meta} />

      {mode === "historical" ? (
        <HistoricalDashboard reading={reading} history={history} meta={historical.meta} />
      ) : (
        <>
      <HeroPanel reading={reading} previousReading={previousReading} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Temperatura exterior"
          icon="thermometer"
          value={reading.temperature}
          previousValue={previousReading?.temperature}
          unit="ºC"
          tone="blue"
          subtitle={`Sensación ${formatMetric(reading.thermalSensation, 1)}ºC`}
        >
          <Sparkline data={history} dataKey="temperature" className="text-primary" />
        </MetricCard>

        <MetricCard
          title="Temperatura interior"
          icon="thermometer"
          value={reading.indoorTemperature}
          previousValue={previousReading?.indoorTemperature}
          unit="ºC"
          tone="red"
          subtitle={getIndoorStatus(reading.indoorTemperature).label}
        >
          <Sparkline data={history} dataKey="indoorTemperature" className="text-error" />
        </MetricCard>

        <MetricCard
          title="Humedad relativa"
          icon="humidity_low"
          value={reading.humidity}
          previousValue={previousReading?.humidity}
          unit="%"
          decimals={0}
          tone="blue"
          subtitle={`Punto de rocío: ${reading.dewPoint}`}
        >
          <Sparkline data={history} dataKey="humidity" className="text-primary" />
        </MetricCard>

        <PressureCard reading={reading} previousReading={previousReading} />

        <MetricCard
          title="Visibilidad"
          icon="visibility"
          value={reading.visibility}
          previousValue={previousReading?.visibility}
          unit="km"
          tone="green"
          subtitle="Condiciones ópticas"
        >
          <Sparkline data={history} dataKey="visibility" className="text-tertiary" />
        </MetricCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <TemperatureHistoryChart history={history} status={status} />
        <RainChart reading={reading} status={status} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <GaugeCard
          title="Humedad relativa"
          value={reading.humidity}
          previousValue={previousReading?.humidity}
          label={getHumidityLabel(reading.humidity)}
          tone="text-primary"
        />

        <div className="xl:col-span-2">
          <WindCompass reading={reading} previousReading={previousReading} />
        </div>

        <MetricCard
          title="Tasa de precipitación"
          icon="rainy"
          value={reading.rainRate}
          previousValue={previousReading?.rainRate}
          unit="mm/h"
          tone="blue"
          subtitle={reading.rainRate > 0 ? "Precipitación activa" : "Sin precipitación"}
        />

        <UvCard reading={reading} previousReading={previousReading} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <MinMaxChart reading={reading} />

        <div className="grid gap-4 sm:grid-cols-2">
          <StatusTile icon="rainy" title="Lluvia" active={reading.isRaining} />
          <StatusTile icon="ac_unit" title="Nieve" active={reading.isSnowing} />
          <AirDensityCard reading={reading} previousReading={previousReading} />
          <MetricCard
            title="Sensación por viento"
            icon="air"
            value={reading.windChill}
            previousValue={previousReading?.windChill}
            unit="ºC"
            tone="slate"
            subtitle="Wind chill"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-outline bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat label="Dirección" value={`${reading.windDirection} (${formatMetric(reading.windDegrees, 0)}º)`} icon="near_me" tone="text-primary" />
          <MiniStat label="Velocidad" value={`${formatMetric(reading.windSpeed, 1)} km/h`} icon="air" tone="text-primary" />
          <MiniStat label="Ráfagas" value={`${formatMetric(reading.windGusts, 2)} km/h`} icon="storm" tone="text-primary" />
        </div>
      </section>
        </>
      )}

      <p className="pb-2 text-center text-xs font-medium text-secondary">
        {mode === "historical"
          ? "Datos históricos obtenidos desde la API REST del backend."
          : websocketUrl ? "Datos actualizados automáticamente por WebSocket." : "Modo demo: define VITE_METEO_WS_URL para conectar el WebSocket real."}
      </p>
    </section>
  );
}
