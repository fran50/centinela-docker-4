import { useCallback, useMemo, useState } from "react";
import { SAMPLE_METEO_READING } from "../data/meteoSample";
import { normalizeMeteoReading } from "../utils/meteo";

const VARIABLES = [
  "temperatura_exterior_c", "temperatura_interior_c", "humedad_relativa_pct",
  "presion_hpa", "punto_rocio_c", "sensacion_termica_c", "velocidad_viento_kmh",
  "rafaga_viento_kmh", "visibilidad_km", "indice_uv", "tasa_precipitacion_mm_h",
  "precipitacion_intervalo_mm", "direccion_viento_grados", "esta_lloviendo", "esta_nevando",
];

const pointValue = (point) => point.media ?? point.valor ?? null;
const valid = (values) => values.filter(Number.isFinite);
const average = (values) => { const data = valid(values); return data.length ? data.reduce((a, b) => a + b, 0) / data.length : null; };
const max = (values) => { const data = valid(values); return data.length ? Math.max(...data) : null; };
const min = (values) => { const data = valid(values); return data.length ? Math.min(...data) : null; };

function windDirection(degrees) {
  if (!Number.isFinite(degrees)) return "—";
  const labels = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return labels[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

function densityFrom(pressure, temperature) {
  if (!Number.isFinite(pressure) || !Number.isFinite(temperature)) return null;
  return (pressure * 100) / (287.05 * (temperature + 273.15));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function extremeLabel(payload, kind) {
  const entries = payload?.puntos?.map((point) => ({ date: point.fecha, value: kind === "max" ? (point.maxima ?? pointValue(point)) : (point.minima ?? pointValue(point)) })).filter((item) => Number.isFinite(item.value)) ?? [];
  if (!entries.length) return "—";
  const chosen = entries.reduce((best, item) => kind === "max" ? (item.value > best.value ? item : best) : (item.value < best.value ? item : best));
  return formatDateTime(chosen.date);
}

export default function useMeteoHistorical({ apiUrl }) {
  const initial = useMemo(() => normalizeMeteoReading(SAMPLE_METEO_READING), []);
  const [reading, setReading] = useState(initial);
  const [history, setHistory] = useState([initial]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const load = useCallback(async ({ from, to, resolution }) => {
    setStatus("loading");
    setError(null);
    try {
      const responses = await Promise.all(VARIABLES.map(async (variable) => {
        const query = new URLSearchParams({ variable, desde: from, hasta: to, resolucion: resolution });
        const response = await fetch(`${apiUrl}/api/series?${query}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Error consultando ${variable}`);
        return [variable, payload];
      }));

      const series = Object.fromEntries(responses);
      const timestamps = [...new Set(responses.flatMap(([, payload]) => (payload.puntos ?? []).map((point) => new Date(point.fecha).toISOString())))].sort();
      const maps = Object.fromEntries(responses.map(([variable, payload]) => [variable, new Map((payload.puntos ?? []).map((point) => [new Date(point.fecha).toISOString(), pointValue(point)]))]));
      const values = (key) => (series[key]?.puntos ?? []).map(pointValue).filter(Number.isFinite);

      const tempValues = values("temperatura_exterior_c");
      const indoorValues = values("temperatura_interior_c");
      const humidityValues = values("humedad_relativa_pct");
      const pressureValues = values("presion_hpa");
      const windValues = values("velocidad_viento_kmh");
      const gustValues = values("rafaga_viento_kmh");
      const uvValues = values("indice_uv");
      const rainValues = values("precipitacion_intervalo_mm");
      const rainingValues = values("esta_lloviendo");
      const snowValues = values("esta_nevando");
      const totalRain = rainValues.reduce((sum, value) => sum + value, 0);
      const windDegrees = average(values("direccion_viento_grados"));
      const intervalHours = timestamps.length > 1 ? Math.max(1 / 60, (new Date(timestamps[1]) - new Date(timestamps[0])) / 3600000) : 0;
      let rainAccumulated = 0;

      const points = timestamps.map((timestamp) => {
        const date = new Date(timestamp);
        const rainInterval = maps.precipitacion_intervalo_mm.get(timestamp) ?? 0;
        rainAccumulated += Number.isFinite(rainInterval) ? rainInterval : 0;
        const raw = {
          temperatura: maps.temperatura_exterior_c.get(timestamp),
          Temperatura_interior: maps.temperatura_interior_c.get(timestamp),
          humidity: maps.humedad_relativa_pct.get(timestamp),
          pressure: maps.presion_hpa.get(timestamp),
          punto_de_rocio: maps.punto_rocio_c.get(timestamp),
          Sensacion_Termica: maps.sensacion_termica_c.get(timestamp),
          velocidad_del_viento: maps.velocidad_viento_kmh.get(timestamp),
          Rafagas_del_viento: maps.rafaga_viento_kmh.get(timestamp),
          Visibilidad: maps.visibilidad_km.get(timestamp),
          Indice_UV: maps.indice_uv.get(timestamp),
          Tasa_Precipitacion: maps.tasa_precipitacion_mm_h.get(timestamp),
          Direccion_del_viento_Grados: maps.direccion_viento_grados.get(timestamp),
          Direccion_del_viento: windDirection(maps.direccion_viento_grados.get(timestamp)),
          Esta_lloviendo: (maps.esta_lloviendo.get(timestamp) ?? 0) > 0 ? "on" : "off",
          Esta_Nevando: (maps.esta_nevando.get(timestamp) ?? 0) > 0 ? "on" : "off",
          temp_max_dia: max(tempValues), temp_min_dia: min(tempValues),
          temp_max_mes: max(tempValues), temp_min_mes: min(tempValues),
          temp_max_ano: max(tempValues), temp_min_ano: min(tempValues),
          Cantidad_lluvia_hoy: totalRain, Precipitacion_ultimas_24h: totalRain,
          Precipitacion_del_Mes: totalRain, "Precipitacion_del_Año": totalRain,
        };
        const normalized = normalizeMeteoReading(raw, date);
        normalized.density = densityFrom(normalized.pressure, normalized.temperature);
        normalized.windChill = normalized.thermalSensation;
        normalized.rainInterval = rainInterval;
        normalized.rainAccumulated = rainAccumulated;
        return normalized;
      });

      const summaryRaw = {
        temperatura: average(tempValues), Temperatura_interior: average(indoorValues),
        humidity: average(humidityValues), pressure: average(pressureValues),
        punto_de_rocio: average(values("punto_rocio_c")), Sensacion_Termica: average(values("sensacion_termica_c")),
        velocidad_del_viento: average(windValues), Rafagas_del_viento: max(gustValues),
        Visibilidad: average(values("visibilidad_km")), Indice_UV: average(uvValues),
        Tasa_Precipitacion: average(values("tasa_precipitacion_mm_h")),
        Direccion_del_viento_Grados: windDegrees, Direccion_del_viento: windDirection(windDegrees),
        Esta_lloviendo: average(rainingValues) > 0 ? "on" : "off", Esta_Nevando: average(snowValues) > 0 ? "on" : "off",
        temp_max_dia: max(tempValues), temp_min_dia: min(tempValues), temp_max_mes: max(tempValues), temp_min_mes: min(tempValues),
        temp_max_ano: max(tempValues), temp_min_ano: min(tempValues), Cantidad_lluvia_hoy: totalRain,
        Precipitacion_ultimas_24h: totalRain, Precipitacion_del_Mes: totalRain, "Precipitacion_del_Año": totalRain,
      };
      const summary = normalizeMeteoReading(summaryRaw, new Date(to));
      summary.density = densityFrom(summary.pressure, summary.temperature);
      summary.windChill = summary.thermalSensation;

      const coverageValues = responses.flatMap(([, payload]) => (payload.puntos ?? []).map((point) => point.cobertura_pct).filter(Number.isFinite));
      const rainPercent = rainingValues.length ? average(rainingValues) : 0;
      const snowPercent = snowValues.length ? average(snowValues) : 0;
      const stats = {
        tempMin: min(tempValues), tempMax: max(tempValues),
        indoorMin: min(indoorValues), indoorMax: max(indoorValues),
        humidityMin: min(humidityValues), humidityMax: max(humidityValues),
        pressureMin: min(pressureValues), pressureMax: max(pressureValues),
        windMax: max(windValues), gustMax: max(gustValues), uvMax: max(uvValues),
        totalRain, rainPercent, snowPercent,
        rainHours: rainingValues.reduce((sum, value) => sum + (Number.isFinite(value) ? (value / 100) * intervalHours : 0), 0),
        coverage: coverageValues.length ? average(coverageValues) : 100,
        tempMaxLabel: extremeLabel(series.temperatura_exterior_c, "max"),
        tempMinLabel: extremeLabel(series.temperatura_exterior_c, "min"),
        gustMaxLabel: extremeLabel(series.rafaga_viento_kmh, "max"),
      };

      setReading(summary);
      setHistory(points.length ? points : [summary]);
      setMeta({ from, to, resolution: series.temperatura_exterior_c?.resolucion ?? resolution, points: points.length, stats });
      setStatus("historical");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "No se pudieron cargar los datos históricos");
      setStatus("error");
    }
  }, [apiUrl]);

  return { reading, history, status, error, meta, load };
}
