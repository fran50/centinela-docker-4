export const SAMPLE_METEO_READING = {
  temperatura: 20.7,
  temp_max_dia: 20.7,
  temp_min_dia: 17.8,
  temp_max_mes: 35.8,
  temp_min_mes: 16.4,
  temp_max_ano: 37.6,
  temp_min_ano: 4.4,
  humidity: 28,
  pressure: "unknown",
  densidad: 1.15,
  punto_de_rocio: "light_air",
  Sensacion_Termica: "22.2 ",
  Temperatura_interior: 38.5,
  Esta_Nevando: "off",
  Esta_lloviendo: "off",
  Precipitacion_del_Mes: 6.8,
  "Precipitacion_del_Año": 82.5,
  Precipitacion_ultimas_24h: 6.8,
  Tasa_Precipitacion: 0.0,
  Cantidad_lluvia_hoy: 3.5,
  Tendencia_en_la_presion: "falling",
  rayos_UV: "unknown",
  Indice_UV: "unknown",
  Visibilidad: 20.9,
  Direccion_del_viento: "ne",
  Sensacion_terminca_por_Viento: 20.7,
  Direccion_del_viento_Grados: 49,
  Rafagas_del_viento: "5.04",
  velocidad_del_viento: 3.6,
};

export function createMockReading(base = SAMPLE_METEO_READING) {
  const jitter = (value, range = 1, decimals = 1) => {
    const next = Number(value) + (Math.random() * range * 2 - range);
    return Number(next.toFixed(decimals));
  };

  const windDirection = Math.round((Number(base.Direccion_del_viento_Grados) + Math.random() * 18 - 9 + 360) % 360);

  return {
    ...base,
    temperatura: jitter(base.temperatura, 0.6),
    Temperatura_interior: jitter(base.Temperatura_interior, 0.8),
    Sensacion_Termica: String(jitter(base.Sensacion_Termica, 0.4)),
    humidity: Math.max(0, Math.min(100, Math.round(jitter(base.humidity, 3, 0)))),
    Visibilidad: Math.max(0, jitter(base.Visibilidad, 1.2)),
    velocidad_del_viento: Math.max(0, jitter(base.velocidad_del_viento, 0.8)),
    Rafagas_del_viento: String(Math.max(0, jitter(base.Rafagas_del_viento, 1.1, 2))),
    Direccion_del_viento_Grados: windDirection,
    Direccion_del_viento: degreesToDirection(windDirection),
    Tasa_Precipitacion: Math.max(0, jitter(base.Tasa_Precipitacion, 0.1, 1)),
  };
}

function degreesToDirection(degrees) {
  const directions = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
  return directions[Math.round(degrees / 45) % 8];
}
