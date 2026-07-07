"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { app } = require("../app");

test("el backend no sirve React y expone información JSON en la raíz", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /application\/json/);

  const body = await response.json();
  assert.equal(body.tipo, "backend-only");
  assert.equal(body.servicio, "estacion-meteorologica-backend");
});

test("una ruta de frontend no se resuelve como SPA", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/meteo`);
  assert.equal(response.status, 404);
  assert.doesNotMatch(response.headers.get("content-type") || "", /text\/html.*charset=utf-8/i);
});
