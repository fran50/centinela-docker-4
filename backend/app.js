"use strict";

require("dotenv").config();

const mqtt = require("mqtt");
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { DateTime } = require("luxon");

// =============================================================================
// Configuración
// =============================================================================
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://127.0.0.1:1883";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "casa/estacion";
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB = process.env.MONGODB_DB || "estacion_meteorologica";

// MONGODB_COLLECTION se conserva como alias para facilitar la migración
// desde la versión anterior del proyecto.
const RAW_COLLECTION =
  process.env.RAW_COLLECTION ||
  process.env.MONGODB_COLLECTION ||
  "mediciones_raw";
const MINUTE_COLLECTION = process.env.MINUTE_COLLECTION || "series_minuto";
const HOUR_COLLECTION = process.env.HOUR_COLLECTION || "series_hora";
const DAY_COLLECTION = process.env.DAY_COLLECTION || "series_dia";
const PREDICTIONS_COLLECTION =
  process.env.PREDICTIONS_COLLECTION || "predicciones";

const STATION_ID = process.env.STATION_ID || "estacion-001";
const LOCATION_ID = process.env.LOCATION_ID || "talavera-01";
const TIME_ZONE = process.env.TIME_ZONE || "Europe/Madrid";
const HTTP_PORT = Number(process.env.HTTP_PORT || 3001);
const WS_PORT = Number(process.env.WS_PORT || 8080);
const WS_HOST = process.env.WS_HOST || "0.0.0.0";
const WS_PATH = process.env.WS_PATH || "/meteo";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const SAMPLE_INTERVAL_SECONDS = Number(
  process.env.SAMPLE_INTERVAL_SECONDS || 3
);
const AGGREGATION_GRACE_SECONDS = Number(
  process.env.AGGREGATION_GRACE_SECONDS || 8
);
const MAX_API_POINTS = Number(process.env.MAX_API_POINTS || 5000);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

if (!Number.isFinite(HTTP_PORT) || HTTP_PORT <= 0) {
  throw new Error("HTTP_PORT no es válido");
}
if (!Number.isFinite(WS_PORT) || WS_PORT <= 0) {
  throw new Error("WS_PORT no es válido");
}
if (!WS_PATH.startsWith("/")) {
  throw new Error("WS_PATH debe comenzar por /");
}
if (!Number.isFinite(SAMPLE_INTERVAL_SECONDS) || SAMPLE_INTERVAL_SECONDS <= 0) {
  throw new Error("SAMPLE_INTERVAL_SECONDS no es válido");
}

const mqttOptions = {
  reconnectPeriod: 5000,
  connectTimeout: 10000,
  clean: true,
  ...(MQTT_USERNAME ? { username: MQTT_USERNAME } : {}),
  ...(MQTT_PASSWORD ? { password: MQTT_PASSWORD } : {})
};

const mongoClient = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 20
});

let db;
const collections = {};
let server;
let wss;
let mqttClient;
let schedulerTimeout;
let schedulerRunning = false;
const websocketClients = new Set();
let latestWebSocketPayload = null;
let temperatureExtremesCache = null;

// =============================================================================
// Variables que pueden consultarse desde la API
// =============================================================================
const NUMERIC_METRICS = [
  "temperatura_exterior_c",
  "temperatura_interior_c",
  "humedad_relativa_pct",
  "presion_hpa",
  "densidad_aire_kg_m3",
  "punto_rocio_c",
  "sensacion_termica_c",
  "sensacion_termica_viento_c",
  "tasa_precipitacion_mm_h",
  "visibilidad_km",
  "radiacion_uv_w_m2",
  "indice_uv",
  "velocidad_viento_kmh",
  "rafaga_viento_kmh"
];

const SERIES_VARIABLES = {
  temperatura_exterior_c: {
    etiqueta: "Temperatura exterior",
    unidad: "°C",
    tipo: "numerica",
    rawField: "temperatura_exterior_c"
  },
  temperatura_interior_c: {
    etiqueta: "Temperatura interior",
    unidad: "°C",
    tipo: "numerica",
    rawField: "temperatura_interior_c"
  },
  humedad_relativa_pct: {
    etiqueta: "Humedad relativa",
    unidad: "%",
    tipo: "numerica",
    rawField: "humedad_relativa_pct"
  },
  presion_hpa: {
    etiqueta: "Presión",
    unidad: "hPa",
    tipo: "numerica",
    rawField: "presion_hpa"
  },
  punto_rocio_c: {
    etiqueta: "Punto de rocío",
    unidad: "°C",
    tipo: "numerica",
    rawField: "punto_rocio_c"
  },
  sensacion_termica_c: {
    etiqueta: "Sensación térmica",
    unidad: "°C",
    tipo: "numerica",
    rawField: "sensacion_termica_c"
  },
  velocidad_viento_kmh: {
    etiqueta: "Velocidad del viento",
    unidad: "km/h",
    tipo: "numerica",
    rawField: "velocidad_viento_kmh"
  },
  rafaga_viento_kmh: {
    etiqueta: "Ráfagas de viento",
    unidad: "km/h",
    tipo: "numerica",
    rawField: "rafaga_viento_kmh"
  },
  visibilidad_km: {
    etiqueta: "Visibilidad",
    unidad: "km",
    tipo: "numerica",
    rawField: "visibilidad_km"
  },
  indice_uv: {
    etiqueta: "Índice UV",
    unidad: "",
    tipo: "numerica",
    rawField: "indice_uv"
  },
  tasa_precipitacion_mm_h: {
    etiqueta: "Tasa de precipitación",
    unidad: "mm/h",
    tipo: "numerica",
    rawField: "tasa_precipitacion_mm_h"
  },
  precipitacion_intervalo_mm: {
    etiqueta: "Precipitación del intervalo",
    unidad: "mm",
    tipo: "precipitacion_intervalo",
    rawField: "precipitacion_hoy_mm"
  },
  precipitacion_acumulada_dia_mm: {
    etiqueta: "Precipitación acumulada del día",
    unidad: "mm",
    tipo: "precipitacion_acumulada",
    rawField: "precipitacion_hoy_mm"
  },
  direccion_viento_grados: {
    etiqueta: "Dirección del viento",
    unidad: "°",
    tipo: "direccion",
    rawField: "direccion_viento_grados"
  },
  esta_lloviendo: {
    etiqueta: "Tiempo con lluvia",
    unidad: "%",
    tipo: "estado_lluvia",
    rawField: "esta_lloviendo"
  },
  esta_nevando: {
    etiqueta: "Tiempo con nieve",
    unidad: "%",
    tipo: "estado_nieve",
    rawField: "esta_nevando"
  }
};

// =============================================================================
// Utilidades de conversión y validación
// =============================================================================
function toNumberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim().toLowerCase() === "unknown")
  ) {
    return null;
  }

  const normalized =
    typeof value === "string" ? value.trim().replace(",", ".") : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    return ["on", "true", "1", "yes", "si", "sí"].includes(
      value.trim().toLowerCase()
    );
  }

  return false;
}

function toDateOrNow(value) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function stringOrNull(value, transform = (text) => text) {
  if (typeof value !== "string" || value.trim() === "") return null;
  return transform(value.trim());
}

function round(value, decimals = 6) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function getNested(object, pathText) {
  return pathText
    .split(".")
    .reduce((current, key) => (current == null ? undefined : current[key]), object);
}

function normalizeDegrees(value) {
  if (!isFiniteNumber(value)) return null;
  return ((value % 360) + 360) % 360;
}

function normalizeMeasurement(rawData, topic) {
  const measuredAt = toDateOrNow(
    rawData.fecha_hora || rawData.fechaHora || rawData.timestamp
  );

  const directionDegrees = normalizeDegrees(
    toNumberOrNull(rawData.Direccion_del_viento_Grados)
  );
  const directionRadians = isFiniteNumber(directionDegrees)
    ? (directionDegrees * Math.PI) / 180
    : null;

  const measurement = {
    fecha_hora: measuredAt,
    recibido_en: new Date(),

    meta: {
      estacion_id: rawData.estacion_id || rawData.estacionId || STATION_ID,
      ubicacion_id: rawData.ubicacion_id || rawData.ubicacionId || LOCATION_ID,
      topic_mqtt: topic
    },

    temperatura_exterior_c: toNumberOrNull(rawData.temperatura),
    temperatura_interior_c: toNumberOrNull(rawData.Temperatura_interior),
    humedad_relativa_pct: toNumberOrNull(rawData.humidity),
    presion_hpa: toNumberOrNull(rawData.pressure),
    densidad_aire_kg_m3: toNumberOrNull(rawData.densidad),

    // El punto de rocío debe ser numérico. Un texto como "light_air"
    // queda registrado como null y aparecerá en la información de calidad.
    punto_rocio_c: toNumberOrNull(rawData.punto_de_rocio),
    sensacion_termica_c: toNumberOrNull(rawData.Sensacion_Termica),
    sensacion_termica_viento_c: toNumberOrNull(
      rawData.Sensacion_terminca_por_Viento ??
        rawData.Sensacion_termica_por_Viento
    ),

    esta_nevando: toBoolean(rawData.Esta_Nevando),
    esta_lloviendo: toBoolean(rawData.Esta_lloviendo),

    precipitacion_ultimas_24h_mm: toNumberOrNull(
      rawData.Precipitacion_ultimas_24h
    ),
    tasa_precipitacion_mm_h: toNumberOrNull(rawData.Tasa_Precipitacion),
    precipitacion_hoy_mm: toNumberOrNull(rawData.Cantidad_lluvia_hoy),
    precipitacion_mes_mm: toNumberOrNull(rawData.Precipitacion_del_Mes),
    precipitacion_ano_mm: toNumberOrNull(
      rawData["Precipitacion_del_Año"] ?? rawData.Precipitacion_del_Ano
    ),

    tendencia_presion: stringOrNull(
      rawData.Tendencia_en_la_presion,
      (value) => value.toLowerCase()
    ),

    radiacion_uv_w_m2: toNumberOrNull(rawData.rayos_UV),
    indice_uv: toNumberOrNull(rawData.Indice_UV),
    visibilidad_km: toNumberOrNull(rawData.Visibilidad),

    direccion_viento: stringOrNull(
      rawData.Direccion_del_viento,
      (value) => value.toUpperCase()
    ),
    direccion_viento_grados: directionDegrees,
    direccion_viento_sin: isFiniteNumber(directionRadians)
      ? Math.sin(directionRadians)
      : null,
    direccion_viento_cos: isFiniteNumber(directionRadians)
      ? Math.cos(directionRadians)
      : null,
    rafaga_viento_kmh: toNumberOrNull(rawData.Rafagas_del_viento),
    velocidad_viento_kmh: toNumberOrNull(rawData.velocidad_del_viento),

    numero_secuencia: toNumberOrNull(
      rawData.numero_secuencia ?? rawData.numeroSecuencia
    ),
    schema_version: 2
  };

  const requiredFields = [
    "temperatura_exterior_c",
    "humedad_relativa_pct",
    "presion_hpa",
    "velocidad_viento_kmh"
  ];
  const missingFields = requiredFields.filter(
    (field) => !isFiniteNumber(measurement[field])
  );
  const outOfRange = [];

  if (
    isFiniteNumber(measurement.humedad_relativa_pct) &&
    (measurement.humedad_relativa_pct < 0 ||
      measurement.humedad_relativa_pct > 100)
  ) {
    outOfRange.push("humedad_relativa_pct");
  }
  if (
    isFiniteNumber(measurement.temperatura_exterior_c) &&
    (measurement.temperatura_exterior_c < -80 ||
      measurement.temperatura_exterior_c > 70)
  ) {
    outOfRange.push("temperatura_exterior_c");
  }

  measurement.calidad = {
    completa: missingFields.length === 0,
    campos_no_disponibles: missingFields,
    valores_fuera_rango: outOfRange,
    latencia_ms: Math.max(
      0,
      measurement.recibido_en.getTime() - measurement.fecha_hora.getTime()
    )
  };

  return measurement;
}

// =============================================================================
// Cálculos estadísticos
// =============================================================================
function computeStats(values) {
  const valid = values.filter(isFiniteNumber);
  if (valid.length === 0) {
    return {
      media: null,
      minima: null,
      maxima: null,
      inicial: null,
      final: null,
      variacion: null,
      desviacion: null,
      muestras_validas: 0
    };
  }

  const total = valid.reduce((sum, value) => sum + value, 0);
  const mean = total / valid.length;
  const variance =
    valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    valid.length;

  return {
    media: round(mean),
    minima: round(Math.min(...valid)),
    maxima: round(Math.max(...valid)),
    inicial: round(valid[0]),
    final: round(valid[valid.length - 1]),
    variacion: round(valid[valid.length - 1] - valid[0]),
    desviacion: round(Math.sqrt(variance)),
    muestras_validas: valid.length
  };
}

function combineStats(statsList) {
  const valid = statsList.filter(
    (stats) =>
      stats &&
      isFiniteNumber(stats.media) &&
      Number.isInteger(stats.muestras_validas) &&
      stats.muestras_validas > 0
  );

  if (valid.length === 0) return computeStats([]);

  const totalN = valid.reduce((sum, stats) => sum + stats.muestras_validas, 0);
  const combinedMean =
    valid.reduce(
      (sum, stats) => sum + stats.media * stats.muestras_validas,
      0
    ) / totalN;

  const combinedVariance =
    valid.reduce((sum, stats) => {
      const variance = isFiniteNumber(stats.desviacion)
        ? stats.desviacion ** 2
        : 0;
      return (
        sum +
        stats.muestras_validas *
          (variance + (stats.media - combinedMean) ** 2)
      );
    }, 0) / totalN;

  const first = valid.find((stats) => isFiniteNumber(stats.inicial));
  const last = [...valid]
    .reverse()
    .find((stats) => isFiniteNumber(stats.final));
  const minima = valid
    .map((stats) => stats.minima)
    .filter(isFiniteNumber);
  const maxima = valid
    .map((stats) => stats.maxima)
    .filter(isFiniteNumber);

  return {
    media: round(combinedMean),
    minima: minima.length ? round(Math.min(...minima)) : null,
    maxima: maxima.length ? round(Math.max(...maxima)) : null,
    inicial: first ? first.inicial : null,
    final: last ? last.final : null,
    variacion:
      first && last ? round(last.final - first.inicial) : null,
    desviacion: round(Math.sqrt(combinedVariance)),
    muestras_validas: totalN
  };
}

function cumulativeIncrement(values) {
  const valid = values.filter(isFiniteNumber);
  if (valid.length < 2) return 0;

  let increment = 0;
  let previous = valid[0];

  for (let index = 1; index < valid.length; index += 1) {
    const current = valid[index];
    if (current >= previous) {
      increment += current - previous;
    } else {
      // Reinicio del acumulador, normalmente por cambio de día.
      increment += Math.max(current, 0);
    }
    previous = current;
  }

  return round(increment);
}

function circularMeanFromRaw(documents) {
  const pairs = documents
    .filter(
      (document) =>
        isFiniteNumber(document.direccion_viento_sin) &&
        isFiniteNumber(document.direccion_viento_cos)
    )
    .map((document) => ({
      sin: document.direccion_viento_sin,
      cos: document.direccion_viento_cos,
      weight: 1
    }));

  return circularMean(pairs);
}

function circularMeanFromAggregates(documents) {
  const pairs = documents
    .map((document) => document.viento_direccion)
    .filter(
      (direction) =>
        direction &&
        isFiniteNumber(direction.sin_media) &&
        isFiniteNumber(direction.cos_media) &&
        Number.isInteger(direction.muestras_validas) &&
        direction.muestras_validas > 0
    )
    .map((direction) => ({
      sin: direction.sin_media,
      cos: direction.cos_media,
      weight: direction.muestras_validas
    }));

  return circularMean(pairs);
}

function circularMean(pairs) {
  if (pairs.length === 0) {
    return {
      media_grados: null,
      sin_media: null,
      cos_media: null,
      muestras_validas: 0
    };
  }

  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);
  const sinMean =
    pairs.reduce((sum, pair) => sum + pair.sin * pair.weight, 0) /
    totalWeight;
  const cosMean =
    pairs.reduce((sum, pair) => sum + pair.cos * pair.weight, 0) /
    totalWeight;

  let degrees = (Math.atan2(sinMean, cosMean) * 180) / Math.PI;
  if (degrees < 0) degrees += 360;

  return {
    media_grados: round(degrees),
    sin_media: round(sinMean),
    cos_media: round(cosMean),
    muestras_validas: totalWeight
  };
}

function percentage(part, total) {
  return total > 0 ? round((part / total) * 100, 3) : null;
}

function buildAggregateFromRaw(documents, interval) {
  if (documents.length === 0) return null;

  const metrics = {};
  for (const field of NUMERIC_METRICS) {
    metrics[field] = computeStats(documents.map((document) => document[field]));
  }

  const rainValues = documents.map((document) => document.precipitacion_hoy_mm);
  const validRainValues = rainValues.filter(isFiniteNumber);
  const rainCount = documents.filter((document) => document.esta_lloviendo).length;
  const snowCount = documents.filter((document) => document.esta_nevando).length;
  const expectedSamples = Math.max(
    1,
    Math.round(
      (interval.end.toMillis() - interval.start.toMillis()) /
        1000 /
        SAMPLE_INTERVAL_SECONDS
    )
  );

  return {
    fecha_hora: interval.start.toUTC().toJSDate(),
    fecha_fin: interval.end.toUTC().toJSDate(),
    estacion_id: documents[0].meta.estacion_id,
    meta: {
      estacion_id: documents[0].meta.estacion_id,
      ubicacion_id: documents[0].meta.ubicacion_id
    },
    resolucion: interval.resolution,
    metricas: metrics,
    precipitacion: {
      incremento_mm: cumulativeIncrement(rainValues),
      acumulada_inicio_mm: validRainValues.length ? validRainValues[0] : null,
      acumulada_fin_mm: validRainValues.length
        ? validRainValues[validRainValues.length - 1]
        : null,
      acumulada_mes_fin_mm: [...documents]
        .reverse()
        .map((document) => document.precipitacion_mes_mm)
        .find(isFiniteNumber) ?? null,
      acumulada_ano_fin_mm: [...documents]
        .reverse()
        .map((document) => document.precipitacion_ano_mm)
        .find(isFiniteNumber) ?? null
    },
    viento_direccion: circularMeanFromRaw(documents),
    estados: {
      lluvia_muestras: rainCount,
      nieve_muestras: snowCount,
      lluvia_porcentaje: percentage(rainCount, documents.length),
      nieve_porcentaje: percentage(snowCount, documents.length)
    },
    muestras: {
      recibidas: documents.length,
      esperadas: expectedSamples,
      cobertura_pct: percentage(documents.length, expectedSamples)
    },
    schema_version: 2,
    actualizado_en: new Date()
  };
}

function buildAggregateFromChildren(documents, interval) {
  if (documents.length === 0) return null;

  const metrics = {};
  for (const field of NUMERIC_METRICS) {
    metrics[field] = combineStats(
      documents.map((document) => document.metricas?.[field])
    );
  }

  const firstPrecipitation = documents.find(
    (document) =>
      document.precipitacion &&
      isFiniteNumber(document.precipitacion.acumulada_inicio_mm)
  )?.precipitacion;
  const lastPrecipitation = [...documents]
    .reverse()
    .find(
      (document) =>
        document.precipitacion &&
        isFiniteNumber(document.precipitacion.acumulada_fin_mm)
    )?.precipitacion;

  const receivedSamples = documents.reduce(
    (sum, document) => sum + (document.muestras?.recibidas || 0),
    0
  );
  const expectedSamples = documents.reduce(
    (sum, document) => sum + (document.muestras?.esperadas || 0),
    0
  );
  const rainCount = documents.reduce(
    (sum, document) => sum + (document.estados?.lluvia_muestras || 0),
    0
  );
  const snowCount = documents.reduce(
    (sum, document) => sum + (document.estados?.nieve_muestras || 0),
    0
  );

  return {
    fecha_hora: interval.start.toUTC().toJSDate(),
    fecha_fin: interval.end.toUTC().toJSDate(),
    estacion_id: documents[0].estacion_id,
    meta: documents[0].meta,
    resolucion: interval.resolution,
    metricas: metrics,
    precipitacion: {
      incremento_mm: round(
        documents.reduce(
          (sum, document) =>
            sum + (document.precipitacion?.incremento_mm || 0),
          0
        )
      ),
      acumulada_inicio_mm:
        firstPrecipitation?.acumulada_inicio_mm ?? null,
      acumulada_fin_mm: lastPrecipitation?.acumulada_fin_mm ?? null,
      acumulada_mes_fin_mm:
        lastPrecipitation?.acumulada_mes_fin_mm ?? null,
      acumulada_ano_fin_mm:
        lastPrecipitation?.acumulada_ano_fin_mm ?? null
    },
    viento_direccion: circularMeanFromAggregates(documents),
    estados: {
      lluvia_muestras: rainCount,
      nieve_muestras: snowCount,
      lluvia_porcentaje: percentage(rainCount, receivedSamples),
      nieve_porcentaje: percentage(snowCount, receivedSamples)
    },
    muestras: {
      recibidas: receivedSamples,
      esperadas: expectedSamples,
      cobertura_pct: percentage(receivedSamples, expectedSamples)
    },
    schema_version: 2,
    actualizado_en: new Date()
  };
}

// =============================================================================
// MongoDB y agregaciones
// =============================================================================
async function collectionExists(name) {
  return db.listCollections({ name }, { nameOnly: true }).hasNext();
}

async function ensureCollections() {
  if (!(await collectionExists(RAW_COLLECTION))) {
    await db.createCollection(RAW_COLLECTION, {
      timeseries: {
        timeField: "fecha_hora",
        metaField: "meta",
        granularity: "seconds"
      }
    });
    console.log(`Colección Time Series creada: ${RAW_COLLECTION}`);
  }

  for (const name of [
    MINUTE_COLLECTION,
    HOUR_COLLECTION,
    DAY_COLLECTION,
    PREDICTIONS_COLLECTION
  ]) {
    if (!(await collectionExists(name))) {
      await db.createCollection(name);
      console.log(`Colección creada: ${name}`);
    }
  }

  collections.raw = db.collection(RAW_COLLECTION);
  collections.minute = db.collection(MINUTE_COLLECTION);
  collections.hour = db.collection(HOUR_COLLECTION);
  collections.day = db.collection(DAY_COLLECTION);
  collections.predictions = db.collection(PREDICTIONS_COLLECTION);

  await collections.raw.createIndex({
    "meta.estacion_id": 1,
    fecha_hora: 1
  });

  for (const collection of [
    collections.minute,
    collections.hour,
    collections.day
  ]) {
    await collection.createIndex(
      { estacion_id: 1, fecha_hora: 1 },
      { unique: true }
    );
  }

  await collections.predictions.createIndex({
    estacion_id: 1,
    fecha_hora: 1,
    "modelo.nombre": 1,
    "modelo.version": 1
  });
}

function intervalFor(resolution, startDateTime) {
  const start = startDateTime.setZone(TIME_ZONE).startOf(resolution);
  const amount = { [resolution]: 1 };
  return {
    resolution,
    start,
    end: start.plus(amount)
  };
}

function collectionForResolution(resolution) {
  if (resolution === "minuto") return collections.minute;
  if (resolution === "hora") return collections.hour;
  if (resolution === "dia") return collections.day;
  throw new Error(`Resolución no soportada: ${resolution}`);
}

function sourceForResolution(resolution) {
  if (resolution === "minuto") return collections.raw;
  if (resolution === "hora") return collections.minute;
  if (resolution === "dia") return collections.hour;
  throw new Error(`Resolución no soportada: ${resolution}`);
}

function luxonUnit(resolution) {
  return {
    minuto: "minute",
    hora: "hour",
    dia: "day"
  }[resolution];
}

async function aggregateInterval(resolution, startDateTime, stationId = STATION_ID) {
  const unit = luxonUnit(resolution);
  const interval = intervalFor(unit, startDateTime);
  interval.resolution = resolution;

  const source = sourceForResolution(resolution);
  const destination = collectionForResolution(resolution);
  const stationField = resolution === "minuto" ? "meta.estacion_id" : "estacion_id";

  const documents = await source
    .find({
      [stationField]: stationId,
      fecha_hora: {
        $gte: interval.start.toUTC().toJSDate(),
        $lt: interval.end.toUTC().toJSDate()
      }
    })
    .sort({ fecha_hora: 1 })
    .toArray();

  const aggregate =
    resolution === "minuto"
      ? buildAggregateFromRaw(documents, interval)
      : buildAggregateFromChildren(documents, interval);

  if (!aggregate) return null;

  await destination.updateOne(
    {
      estacion_id: aggregate.estacion_id,
      fecha_hora: aggregate.fecha_hora
    },
    {
      $set: aggregate,
      $setOnInsert: { creado_en: new Date() }
    },
    { upsert: true }
  );

  return aggregate;
}

async function aggregateRange(resolution, from, to, stationId = STATION_ID) {
  const unit = luxonUnit(resolution);
  let cursor = from.setZone(TIME_ZONE).startOf(unit);
  const end = to.setZone(TIME_ZONE);
  let processed = 0;
  let generated = 0;

  while (cursor < end) {
    const result = await aggregateInterval(resolution, cursor, stationId);
    processed += 1;
    if (result) generated += 1;
    cursor = cursor.plus({ [unit]: 1 });
  }

  return { processed, generated };
}

function parseMqttMessage(message) {
  let rawData;
  try {
    rawData = JSON.parse(message.toString("utf8"));
  } catch (error) {
    throw new Error(`El mensaje MQTT no contiene JSON válido: ${error.message}`);
  }

  if (!rawData || Array.isArray(rawData) || typeof rawData !== "object") {
    throw new Error("El mensaje MQTT debe contener un objeto JSON");
  }

  return rawData;
}

async function saveMeasurement(measurement) {
  const result = await collections.raw.insertOne(measurement);
  return result.insertedId;
}

function periodInformation(measuredAt) {
  const localDate = DateTime.fromJSDate(measuredAt, { zone: "utc" }).setZone(
    TIME_ZONE
  );

  return {
    dayKey: localDate.toFormat("yyyy-LL-dd"),
    monthKey: localDate.toFormat("yyyy-LL"),
    yearKey: localDate.toFormat("yyyy"),
    dayStart: localDate.startOf("day").toUTC().toJSDate(),
    dayEnd: localDate.plus({ days: 1 }).startOf("day").toUTC().toJSDate(),
    monthStart: localDate.startOf("month").toUTC().toJSDate(),
    monthEnd: localDate.plus({ months: 1 }).startOf("month").toUTC().toJSDate(),
    yearStart: localDate.startOf("year").toUTC().toJSDate(),
    yearEnd: localDate.plus({ years: 1 }).startOf("year").toUTC().toJSDate()
  };
}

function emptyTemperatureExtremes(stationId, periods) {
  return {
    stationId,
    dayKey: periods.dayKey,
    monthKey: periods.monthKey,
    yearKey: periods.yearKey,
    dayMin: null,
    dayMax: null,
    monthMin: null,
    monthMax: null,
    yearMin: null,
    yearMax: null
  };
}

function updateMinMax(currentMin, currentMax, value) {
  if (!isFiniteNumber(value)) return { min: currentMin, max: currentMax };
  return {
    min: isFiniteNumber(currentMin) ? Math.min(currentMin, value) : value,
    max: isFiniteNumber(currentMax) ? Math.max(currentMax, value) : value
  };
}

function updateTemperatureExtremes(cache, temperature) {
  const day = updateMinMax(cache.dayMin, cache.dayMax, temperature);
  const month = updateMinMax(cache.monthMin, cache.monthMax, temperature);
  const year = updateMinMax(cache.yearMin, cache.yearMax, temperature);

  cache.dayMin = day.min;
  cache.dayMax = day.max;
  cache.monthMin = month.min;
  cache.monthMax = month.max;
  cache.yearMin = year.min;
  cache.yearMax = year.max;
  return cache;
}

function firstFacetValue(facet, field) {
  const value = facet?.[0]?.[field];
  return isFiniteNumber(value) ? value : null;
}

async function loadTemperatureExtremes(stationId, periods) {
  const [result = {}] = await collections.raw
    .aggregate([
      {
        $match: {
          "meta.estacion_id": stationId,
          fecha_hora: { $gte: periods.yearStart, $lt: periods.yearEnd },
          temperatura_exterior_c: { $type: "number" }
        }
      },
      {
        $facet: {
          day: [
            {
              $match: {
                fecha_hora: { $gte: periods.dayStart, $lt: periods.dayEnd }
              }
            },
            {
              $group: {
                _id: null,
                min: { $min: "$temperatura_exterior_c" },
                max: { $max: "$temperatura_exterior_c" }
              }
            }
          ],
          month: [
            {
              $match: {
                fecha_hora: {
                  $gte: periods.monthStart,
                  $lt: periods.monthEnd
                }
              }
            },
            {
              $group: {
                _id: null,
                min: { $min: "$temperatura_exterior_c" },
                max: { $max: "$temperatura_exterior_c" }
              }
            }
          ],
          year: [
            {
              $group: {
                _id: null,
                min: { $min: "$temperatura_exterior_c" },
                max: { $max: "$temperatura_exterior_c" }
              }
            }
          ]
        }
      }
    ])
    .toArray();

  return {
    stationId,
    dayKey: periods.dayKey,
    monthKey: periods.monthKey,
    yearKey: periods.yearKey,
    dayMin: firstFacetValue(result.day, "min"),
    dayMax: firstFacetValue(result.day, "max"),
    monthMin: firstFacetValue(result.month, "min"),
    monthMax: firstFacetValue(result.month, "max"),
    yearMin: firstFacetValue(result.year, "min"),
    yearMax: firstFacetValue(result.year, "max")
  };
}

async function getTemperatureExtremes(measurement) {
  const stationId = measurement.meta.estacion_id;
  const periods = periodInformation(measurement.fecha_hora);
  const cacheMatches =
    temperatureExtremesCache &&
    temperatureExtremesCache.stationId === stationId &&
    temperatureExtremesCache.dayKey === periods.dayKey &&
    temperatureExtremesCache.monthKey === periods.monthKey &&
    temperatureExtremesCache.yearKey === periods.yearKey;

  if (!cacheMatches) {
    try {
      temperatureExtremesCache = await loadTemperatureExtremes(
        stationId,
        periods
      );
    } catch (error) {
      console.error(
        "No se pudieron consultar los máximos y mínimos históricos:",
        error.message
      );
      temperatureExtremesCache = emptyTemperatureExtremes(stationId, periods);
    }
  }

  return updateTemperatureExtremes(
    temperatureExtremesCache,
    measurement.temperatura_exterior_c
  );
}

function compatibleSwitch(value) {
  return toBoolean(value) ? "on" : "off";
}

function buildReactWebSocketPayload(rawData, measurement, extremes) {
  const temperature = measurement.temperatura_exterior_c;
  const fallbackTemperature = isFiniteNumber(temperature)
    ? temperature
    : "unknown";
  const windChill =
    rawData.Sensacion_terminca_por_Viento ??
    rawData.Sensacion_termica_por_Viento ??
    measurement.sensacion_termica_viento_c ??
    "unknown";

  // Se conservan todos los campos originales del simulador y únicamente se
  // añaden/adaptan las claves que el React existente espera exactamente.
  return {
    ...rawData,
    temp_max_dia: extremes.dayMax ?? fallbackTemperature,
    temp_min_dia: extremes.dayMin ?? fallbackTemperature,
    temp_max_mes: extremes.monthMax ?? fallbackTemperature,
    temp_min_mes: extremes.monthMin ?? fallbackTemperature,
    temp_max_ano: extremes.yearMax ?? fallbackTemperature,
    temp_min_ano: extremes.yearMin ?? fallbackTemperature,
    Esta_Nevando: compatibleSwitch(rawData.Esta_Nevando),
    Esta_lloviendo: compatibleSwitch(rawData.Esta_lloviendo),
    Sensacion_terminca_por_Viento: windChill
  };
}

// =============================================================================
// Programador de agregaciones
// =============================================================================
async function runAggregationCycle() {
  if (schedulerRunning) return;
  schedulerRunning = true;

  try {
    const now = DateTime.now().setZone(TIME_ZONE);

    // Se recalculan los tres últimos minutos para absorber mensajes retrasados.
    for (let minutesAgo = 1; minutesAgo <= 3; minutesAgo += 1) {
      await aggregateInterval("minuto", now.minus({ minutes: minutesAgo }));
    }

    // Al principio de cada hora se recalculan las dos horas anteriores.
    if (now.minute === 0) {
      await aggregateInterval("hora", now.minus({ hours: 1 }));
      await aggregateInterval("hora", now.minus({ hours: 2 }));
    }

    // Después de medianoche local se consolida el día anterior.
    if (now.hour === 0 && now.minute === 0) {
      await aggregateInterval("dia", now.minus({ days: 1 }));
    }
  } catch (error) {
    console.error("Error en el ciclo de agregación:", error.message);
  } finally {
    schedulerRunning = false;
    scheduleNextAggregation();
  }
}

function scheduleNextAggregation() {
  clearTimeout(schedulerTimeout);
  const now = DateTime.now().setZone(TIME_ZONE);
  const next = now
    .plus({ minutes: 1 })
    .startOf("minute")
    .plus({ seconds: AGGREGATION_GRACE_SECONDS });
  const delay = Math.max(1000, next.toMillis() - now.toMillis());
  schedulerTimeout = setTimeout(runAggregationCycle, delay);
}

async function backfillRecentAggregates() {
  const now = DateTime.now().setZone(TIME_ZONE);

  for (let minutesAgo = 1; minutesAgo <= 10; minutesAgo += 1) {
    await aggregateInterval("minuto", now.minus({ minutes: minutesAgo }));
  }
  for (let hoursAgo = 1; hoursAgo <= 2; hoursAgo += 1) {
    await aggregateInterval("hora", now.minus({ hours: hoursAgo }));
  }
  await aggregateInterval("dia", now.minus({ days: 1 }));
}

// =============================================================================
// Fechas, resolución y API
// =============================================================================
function parseDateParameter(value, label, endDate = false) {
  if (!value) throw new Error(`Falta el parámetro ${label}`);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);

  let dateTime;
  if (dateOnly) {
    dateTime = DateTime.fromISO(value, { zone: TIME_ZONE }).startOf("day");
    if (endDate) dateTime = dateTime.plus({ days: 1 });
  } else {
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
    dateTime = hasZone
      ? DateTime.fromISO(value, { setZone: true })
      : DateTime.fromISO(value, { zone: TIME_ZONE });
  }

  if (!dateTime.isValid) {
    throw new Error(`${label} no contiene una fecha válida`);
  }

  return dateTime.toUTC();
}

function chooseResolution(from, to, requested = "auto") {
  const allowed = ["auto", "raw", "minuto", "hora", "dia"];
  if (!allowed.includes(requested)) {
    throw new Error(`Resolución no válida. Usa: ${allowed.join(", ")}`);
  }
  if (requested !== "auto") return requested;

  const hours = to.diff(from, "hours").hours;
  if (hours <= 2) return "raw";
  if (hours <= 48) return "minuto";
  if (hours <= 24 * 120) return "hora";
  return "dia";
}

function estimatedPointCount(resolution, from, to) {
  const seconds = to.diff(from, "seconds").seconds;
  if (resolution === "raw") return Math.ceil(seconds / SAMPLE_INTERVAL_SECONDS);
  if (resolution === "minuto") return Math.ceil(seconds / 60);
  if (resolution === "hora") return Math.ceil(seconds / 3600);
  return Math.ceil(seconds / 86400);
}

function suggestedResolution(from, to) {
  const seconds = to.diff(from, "seconds").seconds;
  const candidates = [
    ["raw", SAMPLE_INTERVAL_SECONDS],
    ["minuto", 60],
    ["hora", 3600],
    ["dia", 86400]
  ];
  return (
    candidates.find(([, step]) => seconds / step <= MAX_API_POINTS)?.[0] ||
    "dia"
  );
}

function mapRawPoint(document, variableDefinition) {
  const value = document[variableDefinition.rawField];
  return {
    fecha: document.fecha_hora,
    valor:
      typeof value === "boolean"
        ? value
          ? 100
          : 0
        : isFiniteNumber(value)
          ? value
          : null
  };
}

function rawPrecipitationIntervalPoints(documents) {
  const points = [];
  let previous = null;

  for (const document of documents) {
    const current = document.precipitacion_hoy_mm;
    let value = null;

    if (isFiniteNumber(current) && isFiniteNumber(previous)) {
      value = current >= previous ? current - previous : Math.max(current, 0);
      value = round(value);
    }
    if (isFiniteNumber(current)) previous = current;

    points.push({ fecha: document.fecha_hora, valor: value });
  }

  return points;
}

function mapAggregatePoint(document, variable, variableDefinition) {
  if (variableDefinition.tipo === "numerica") {
    const metric = document.metricas?.[variable];
    return {
      fecha: document.fecha_hora,
      media: metric?.media ?? null,
      minima: metric?.minima ?? null,
      maxima: metric?.maxima ?? null,
      inicial: metric?.inicial ?? null,
      final: metric?.final ?? null,
      variacion: metric?.variacion ?? null,
      desviacion: metric?.desviacion ?? null,
      muestras_validas: metric?.muestras_validas ?? 0,
      cobertura_pct: document.muestras?.cobertura_pct ?? null
    };
  }

  if (variableDefinition.tipo === "precipitacion_intervalo") {
    return {
      fecha: document.fecha_hora,
      valor: document.precipitacion?.incremento_mm ?? null,
      cobertura_pct: document.muestras?.cobertura_pct ?? null
    };
  }

  if (variableDefinition.tipo === "precipitacion_acumulada") {
    return {
      fecha: document.fecha_hora,
      valor: document.precipitacion?.acumulada_fin_mm ?? null,
      cobertura_pct: document.muestras?.cobertura_pct ?? null
    };
  }

  if (variableDefinition.tipo === "direccion") {
    return {
      fecha: document.fecha_hora,
      valor: document.viento_direccion?.media_grados ?? null,
      cobertura_pct: document.muestras?.cobertura_pct ?? null
    };
  }

  const stateField =
    variableDefinition.tipo === "estado_lluvia"
      ? "lluvia_porcentaje"
      : "nieve_porcentaje";
  return {
    fecha: document.fecha_hora,
    valor: document.estados?.[stateField] ?? null,
    cobertura_pct: document.muestras?.cobertura_pct ?? null
  };
}

function flattenModelRow(document) {
  const localDate = DateTime.fromJSDate(document.fecha_hora, {
    zone: "utc"
  }).setZone(TIME_ZONE);
  const hourAngle = (2 * Math.PI * localDate.hour) / 24;
  const yearAngle = (2 * Math.PI * localDate.ordinal) / localDate.daysInYear;

  const row = {
    fecha_hora: document.fecha_hora.toISOString(),
    estacion_id: document.estacion_id,
    hora_sin: round(Math.sin(hourAngle)),
    hora_cos: round(Math.cos(hourAngle)),
    dia_ano_sin: round(Math.sin(yearAngle)),
    dia_ano_cos: round(Math.cos(yearAngle)),
    direccion_viento_sin: document.viento_direccion?.sin_media ?? null,
    direccion_viento_cos: document.viento_direccion?.cos_media ?? null,
    precipitacion_intervalo_mm:
      document.precipitacion?.incremento_mm ?? null,
    esta_lloviendo_pct: document.estados?.lluvia_porcentaje ?? null,
    cobertura_pct: document.muestras?.cobertura_pct ?? null
  };

  const modelFields = [
    "temperatura_exterior_c",
    "temperatura_interior_c",
    "humedad_relativa_pct",
    "presion_hpa",
    "punto_rocio_c",
    "sensacion_termica_c",
    "velocidad_viento_kmh",
    "rafaga_viento_kmh",
    "tasa_precipitacion_mm_h",
    "visibilidad_km",
    "indice_uv"
  ];

  for (const field of modelFields) {
    const metric = document.metricas?.[field] || {};
    row[`${field}_media`] = metric.media ?? null;
    row[`${field}_min`] = metric.minima ?? null;
    row[`${field}_max`] = metric.maxima ?? null;
    row[`${field}_desviacion`] = metric.desviacion ?? null;
    row[`${field}_variacion`] = metric.variacion ?? null;
  }

  return row;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function rowsToCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(",")
    )
  ].join("\n");
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// =============================================================================
// HTTP y WebSocket
// =============================================================================
const app = express();
app.use(
  cors({
    origin(origin, callback) {
      // Permite herramientas sin cabecera Origin y el frontend configurado.
      if (!origin || CORS_ORIGIN === "*" || origin === CORS_ORIGIN) {
        return callback(null, true);
      }
      return callback(new Error(`Origen CORS no permitido: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/estado", (_req, res) => {
  res.json({
    estado: "ok",
    servicio: "estacion-meteorologica",
    zona_horaria: TIME_ZONE,
    colecciones: {
      raw: RAW_COLLECTION,
      minuto: MINUTE_COLLECTION,
      hora: HOUR_COLLECTION,
      dia: DAY_COLLECTION
    },
    mongodb: Boolean(collections.raw)
  });
});

app.get("/api/variables", (_req, res) => {
  res.json(
    Object.entries(SERIES_VARIABLES).map(([id, definition]) => ({
      id,
      etiqueta: definition.etiqueta,
      unidad: definition.unidad,
      tipo: definition.tipo
    }))
  );
});

app.get(
  "/api/ultima",
  asyncRoute(async (req, res) => {
    const stationId = req.query.estacion || STATION_ID;
    const document = await collections.raw.findOne(
      { "meta.estacion_id": stationId },
      { sort: { fecha_hora: -1 } }
    );

    if (!document) {
      return res.status(404).json({ error: "No hay mediciones para esa estación" });
    }
    return res.json(document);
  })
);

app.get(
  "/api/series",
  asyncRoute(async (req, res) => {
    const stationId = req.query.estacion || STATION_ID;
    const variable = req.query.variable || "temperatura_exterior_c";
    const variableDefinition = SERIES_VARIABLES[variable];

    if (!variableDefinition) {
      return res.status(400).json({
        error: "Variable no permitida",
        variables: Object.keys(SERIES_VARIABLES)
      });
    }

    const from = parseDateParameter(req.query.desde, "desde", false);
    const to = parseDateParameter(req.query.hasta, "hasta", true);
    if (to <= from) {
      return res.status(400).json({ error: "hasta debe ser posterior a desde" });
    }

    const resolution = chooseResolution(
      from,
      to,
      String(req.query.resolucion || "auto").toLowerCase()
    );
    const estimated = estimatedPointCount(resolution, from, to);

    if (estimated > MAX_API_POINTS) {
      return res.status(413).json({
        error: `La consulta produciría aproximadamente ${estimated} puntos`,
        maximo_puntos: MAX_API_POINTS,
        resolucion_sugerida: suggestedResolution(from, to)
      });
    }

    let documents;
    let points;

    if (resolution === "raw") {
      documents = await collections.raw
        .find({
          "meta.estacion_id": stationId,
          fecha_hora: {
            $gte: from.toJSDate(),
            $lt: to.toJSDate()
          }
        })
        .project({
          _id: 0,
          fecha_hora: 1,
          [variableDefinition.rawField]: 1
        })
        .sort({ fecha_hora: 1 })
        .toArray();

      points =
        variableDefinition.tipo === "precipitacion_intervalo"
          ? rawPrecipitationIntervalPoints(documents)
          : documents.map((document) =>
              mapRawPoint(document, variableDefinition)
            );
    } else {
      const collection = collectionForResolution(resolution);
      documents = await collection
        .find({
          estacion_id: stationId,
          fecha_hora: {
            $gte: from.toJSDate(),
            $lt: to.toJSDate()
          }
        })
        .sort({ fecha_hora: 1 })
        .toArray();

      points = documents.map((document) =>
        mapAggregatePoint(document, variable, variableDefinition)
      );
    }

    return res.json({
      estacion: stationId,
      variable,
      etiqueta: variableDefinition.etiqueta,
      unidad: variableDefinition.unidad,
      tipo: variableDefinition.tipo,
      resolucion: resolution,
      zona_horaria: TIME_ZONE,
      desde: from.toISO(),
      hasta: to.toISO(),
      numero_puntos: points.length,
      puntos: points
    });
  })
);

app.get(
  "/api/modelo/dataset",
  asyncRoute(async (req, res) => {
    const stationId = req.query.estacion || STATION_ID;
    const from = parseDateParameter(req.query.desde, "desde", false);
    const to = parseDateParameter(req.query.hasta, "hasta", true);
    const format = String(req.query.formato || "json").toLowerCase();

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: "formato debe ser json o csv" });
    }

    const documents = await collections.minute
      .find({
        estacion_id: stationId,
        fecha_hora: { $gte: from.toJSDate(), $lt: to.toJSDate() }
      })
      .sort({ fecha_hora: 1 })
      .toArray();

    const rows = documents.map(flattenModelRow);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="dataset_${stationId}.csv"`
      );
      return res.send(`\uFEFF${rowsToCsv(rows)}`);
    }

    return res.json({
      estacion: stationId,
      resolucion: "minuto",
      zona_horaria: TIME_ZONE,
      numero_filas: rows.length,
      datos: rows
    });
  })
);

app.post(
  "/api/admin/recalcular",
  asyncRoute(async (req, res) => {
    if (!ADMIN_API_KEY) {
      return res.status(403).json({
        error: "El recálculo por API está desactivado. Define ADMIN_API_KEY."
      });
    }
    if (req.get("x-api-key") !== ADMIN_API_KEY) {
      return res.status(401).json({ error: "API key incorrecta" });
    }

    const resolution = req.body.resolucion;
    if (!['minuto', 'hora', 'dia'].includes(resolution)) {
      return res.status(400).json({
        error: "resolucion debe ser minuto, hora o dia"
      });
    }

    const from = parseDateParameter(req.body.desde, "desde", false);
    const to = parseDateParameter(req.body.hasta, "hasta", true);
    const unitSeconds = { minuto: 60, hora: 3600, dia: 86400 }[resolution];
    const intervals = Math.ceil(to.diff(from, "seconds").seconds / unitSeconds);

    if (intervals > 10000) {
      return res.status(413).json({
        error: "El rango contiene más de 10.000 intervalos"
      });
    }

    const result = await aggregateRange(
      resolution,
      from,
      to,
      req.body.estacion || STATION_ID
    );
    return res.json({ estado: "ok", resolucion: resolution, ...result });
  })
);

app.get("/", (_req, res) => {
  res.json({
    estado: "ok",
    servicio: "estacion-meteorologica-backend",
    tipo: "backend-only",
    api_rest: `http://localhost:${HTTP_PORT}/api`,
    websocket: `ws://localhost:${WS_PORT}${WS_PATH}`
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: req.path.startsWith("/api/")
      ? "Endpoint de API no encontrado"
      : "Ruta no encontrada"
  });
});

app.use((error, _req, res, _next) => {
  console.error("Error HTTP:", error);
  res.status(400).json({ error: error.message || "Error inesperado" });
});

function broadcast(payload) {
  latestWebSocketPayload = payload;
  const serialized = JSON.stringify(payload);
  for (const ws of websocketClients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(serialized);
  }
}

// =============================================================================
// Inicio y cierre
// =============================================================================
async function start() {
  await mongoClient.connect();
  db = mongoClient.db(MONGODB_DB);
  await ensureCollections();
  console.log(`Conectado a MongoDB: ${MONGODB_DB}`);

  server = app.listen(HTTP_PORT, () => {
    console.log(`API REST: http://localhost:${HTTP_PORT}/api`);
    console.log(`Origen React permitido por CORS: ${CORS_ORIGIN}`);
  });

  // El WebSocket se mantiene separado de la API REST porque el React original
  // ya está configurado para ws://localhost:8080/meteo.
  wss = new WebSocket.Server({
    host: WS_HOST,
    port: WS_PORT,
    path: WS_PATH
  });

  wss.on("listening", () => {
    console.log(`WebSocket para React: ws://localhost:${WS_PORT}${WS_PATH}`);
  });

  wss.on("connection", (ws) => {
    websocketClients.add(ws);

    // No se envían mensajes de control: React interpreta cada mensaje como
    // una lectura meteorológica. Si ya existe una lectura, se entrega al entrar.
    if (latestWebSocketPayload && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(latestWebSocketPayload));
    }

    ws.on("close", () => websocketClients.delete(ws));
    ws.on("error", () => websocketClients.delete(ws));
  });

  wss.on("error", (error) => {
    console.error("Error WebSocket:", error.message);
  });

  mqttClient = mqtt.connect(MQTT_BROKER, mqttOptions);
  mqttClient.on("connect", () => {
    console.log(`Conectado a MQTT: ${MQTT_BROKER}`);
    mqttClient.subscribe(MQTT_TOPIC, { qos: 1 }, (error) => {
      if (error) {
        console.error("Error al suscribirse a MQTT:", error.message);
      } else {
        console.log(`Suscrito al topic: ${MQTT_TOPIC}`);
      }
    });
  });

  mqttClient.on("message", async (topic, message) => {
    let rawData;
    try {
      rawData = parseMqttMessage(message);
    } catch (error) {
      console.error("Mensaje MQTT descartado:", error.message);
      return;
    }

    const measurement = normalizeMeasurement(rawData, topic);

    try {
      const insertedId = await saveMeasurement(measurement);
      console.log(`Medición insertada: ${insertedId}`);
    } catch (error) {
      // El canal en tiempo real no se interrumpe por un fallo puntual del
      // histórico. El error queda registrado y React sigue recibiendo datos.
      console.error("No se pudo guardar la medición:", error.message);
    }

    const extremes = await getTemperatureExtremes(measurement);
    const reactPayload = buildReactWebSocketPayload(
      rawData,
      measurement,
      extremes
    );
    broadcast(reactPayload);
  });

  mqttClient.on("error", (error) => {
    console.error("Error MQTT:", error.message);
  });

  try {
    await backfillRecentAggregates();
    console.log("Agregados recientes comprobados");
  } catch (error) {
    console.error("No se pudieron completar los agregados recientes:", error.message);
  }

  scheduleNextAggregation();
}

async function shutdown(signal) {
  console.log(`\n${signal}: cerrando conexiones...`);
  clearTimeout(schedulerTimeout);

  try {
    if (mqttClient) mqttClient.end(true);
    if (wss) wss.close();
    if (server) server.close();
    await mongoClient.close();
  } catch (error) {
    console.error("Error durante el cierre:", error.message);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  start().catch(async (error) => {
    console.error("No se pudo iniciar el servicio:", error);
    await mongoClient.close().catch(() => {});
    process.exit(1);
  });
}

module.exports = {
  app,
  parseMqttMessage,
  normalizeMeasurement,
  buildReactWebSocketPayload,
  compatibleSwitch
};
