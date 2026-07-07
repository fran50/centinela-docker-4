export function parseNumber(value) {
  if (value === null || value === undefined || value === "" || value === "unknown") return null;
  const parsed = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseBooleanSwitch(value) {
  return String(value).trim().toLowerCase() === "on";
}

export function normalizeMeteoReading(raw, date = new Date()) {
  const now = date instanceof Date ? date : new Date(date);
  return {
    raw,
    timestamp: now,
    label: now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    shortLabel: now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    temperature: parseNumber(raw.temperatura),
    dayMax: parseNumber(raw.temp_max_dia),
    dayMin: parseNumber(raw.temp_min_dia),
    monthMax: parseNumber(raw.temp_max_mes),
    monthMin: parseNumber(raw.temp_min_mes),
    yearMax: parseNumber(raw.temp_max_ano),
    yearMin: parseNumber(raw.temp_min_ano),
    humidity: parseNumber(raw.humidity),
    pressure: parseNumber(raw.pressure),
    density: parseNumber(raw.densidad),
    dewPoint: raw.punto_de_rocio ?? "unknown",
    thermalSensation: parseNumber(raw.Sensacion_Termica),
    indoorTemperature: parseNumber(raw.Temperatura_interior),
    isSnowing: parseBooleanSwitch(raw.Esta_Nevando),
    isRaining: parseBooleanSwitch(raw.Esta_lloviendo),
    monthRain: parseNumber(raw.Precipitacion_del_Mes),
    yearRain: parseNumber(raw["Precipitacion_del_Año"]),
    rain24h: parseNumber(raw.Precipitacion_ultimas_24h),
    rainRate: parseNumber(raw.Tasa_Precipitacion),
    rainToday: parseNumber(raw.Cantidad_lluvia_hoy),
    pressureTrend: raw.Tendencia_en_la_presion ?? "unknown",
    uvRays: parseNumber(raw.rayos_UV),
    uvIndex: parseNumber(raw.Indice_UV),
    visibility: parseNumber(raw.Visibilidad),
    windDirection: String(raw.Direccion_del_viento ?? "unknown").toUpperCase(),
    windChill: parseNumber(raw.Sensacion_terminca_por_Viento),
    windDegrees: parseNumber(raw.Direccion_del_viento_Grados),
    windGusts: parseNumber(raw.Rafagas_del_viento),
    windSpeed: parseNumber(raw.velocidad_del_viento),
  };
}

export function extractJsonPayload(message) {
  if (typeof message !== "string") return message;

  try {
    return JSON.parse(message);
  } catch {
    const start = message.indexOf("{");
    const end = message.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(message.slice(start, end + 1));
    }
    throw new Error("El mensaje WebSocket no contiene JSON válido");
  }
}

export function formatMetric(value, decimals = 1, fallback = "Sin lectura") {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return Number(value).toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getDelta(current, previous) {
  if (current === null || previous === null || current === undefined || previous === undefined) return null;
  const delta = Number(current) - Number(previous);
  return Number.isFinite(delta) ? delta : null;
}

export function changed(current, previous) {
  if (current === undefined || previous === undefined) return false;
  return String(current) !== String(previous);
}

export function getHumidityLabel(value) {
  if (value === null) return "Sin lectura";
  if (value < 30) return "Baja";
  if (value < 60) return "Confortable";
  return "Alta";
}

export function getIndoorStatus(value) {
  if (value === null) return { label: "Sin lectura", tone: "neutral" };
  if (value >= 30) return { label: "Refrigeración requerida", tone: "danger" };
  if (value <= 17) return { label: "Calefacción recomendada", tone: "warning" };
  return { label: "Confort térmico", tone: "success" };
}

export function getPressureTrendIcon(trend) {
  const value = String(trend ?? "").toLowerCase();
  if (value.includes("fall")) return "trending_down";
  if (value.includes("ris")) return "trending_up";
  return "trending_flat";
}
