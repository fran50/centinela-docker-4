"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseMqttMessage,
  normalizeMeasurement,
  buildReactWebSocketPayload
} = require("../app");

test("convierte el JSON real del simulador al formato exacto del React original", () => {
  const raw = {
    fecha_hora: "2026-06-23T16:30:00.000Z",
    estacion_id: "estacion-001",
    ubicacion_id: "talavera-01",
    temperatura: 20.7,
    Temperatura_interior: 23.1,
    humidity: 55,
    pressure: 1014.2,
    densidad: 1.204,
    punto_de_rocio: 11.3,
    Sensacion_Termica: 20.5,
    Sensacion_termica_por_Viento: 19.8,
    Esta_Nevando: false,
    Esta_lloviendo: true,
    Precipitacion_ultimas_24h: 2.4,
    Tasa_Precipitacion: 0.8,
    Cantidad_lluvia_hoy: 1.2,
    Precipitacion_del_Mes: 18.5,
    "Precipitacion_del_Año": 126.7,
    Tendencia_en_la_presion: "falling",
    rayos_UV: 320,
    Indice_UV: 3.8,
    Visibilidad: 18.4,
    Direccion_del_viento: "NE",
    Direccion_del_viento_Grados: 45,
    Rafagas_del_viento: 12.5,
    velocidad_del_viento: 8.4,
    numero_secuencia: 125
  };

  const measurement = normalizeMeasurement(raw, "casa/estacion");
  const payload = buildReactWebSocketPayload(raw, measurement, {
    dayMin: 16.8,
    dayMax: 22.1,
    monthMin: 12.4,
    monthMax: 35.8,
    yearMin: 4.4,
    yearMax: 37.6
  });

  assert.equal(payload.temperatura, 20.7);
  assert.equal(payload.temp_max_dia, 22.1);
  assert.equal(payload.temp_min_dia, 16.8);
  assert.equal(payload.temp_max_mes, 35.8);
  assert.equal(payload.temp_min_mes, 12.4);
  assert.equal(payload.temp_max_ano, 37.6);
  assert.equal(payload.temp_min_ano, 4.4);
  assert.equal(payload.Esta_lloviendo, "on");
  assert.equal(payload.Esta_Nevando, "off");
  assert.equal(payload.Sensacion_terminca_por_Viento, 19.8);
  assert.equal(payload.Sensacion_termica_por_Viento, 19.8);
  assert.equal(payload["Precipitacion_del_Año"], 126.7);
  assert.equal(payload.numero_secuencia, 125);
  assert.equal(Object.hasOwn(payload, "tipo"), false);
  assert.equal(Object.hasOwn(payload, "value"), false);

  // El objeto original no se modifica.
  assert.equal(raw.Esta_lloviendo, true);
  assert.equal(Object.hasOwn(raw, "temp_max_dia"), false);
});

test("rechaza mensajes MQTT que no contienen un objeto JSON", () => {
  assert.throws(() => parseMqttMessage(Buffer.from("no-json")), /JSON válido/);
  assert.throws(() => parseMqttMessage(Buffer.from("[]")), /objeto JSON/);
});
