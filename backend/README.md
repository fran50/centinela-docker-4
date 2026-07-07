# Estación meteorológica — backend puro 2.5.0

Este proyecto contiene únicamente el backend. No incluye, compila ni sirve una aplicación React.

```text
Simulador MQTT
      │
      ▼
Backend Node.js
      ├── MongoDB
      ├── API REST histórica: http://localhost:3001/api/...
      └── WebSocket en tiempo real: ws://localhost:8080/meteo
              │
              ▼
      Aplicación React externa
```

## Instalación

```bash
npm install
cp .env.example .env
npm start
```

En Windows:

```cmd
npm install
copy .env.example .env
npm start
```

## Servicios

- Información del backend: `http://localhost:3001/`
- Estado: `http://localhost:3001/api/estado`
- Última medición histórica: `http://localhost:3001/api/ultima`
- Series históricas: `http://localhost:3001/api/series`
- WebSocket para React: `ws://localhost:8080/meteo`
- MQTT: `mqtt://127.0.0.1:1883`, topic `casa/estacion`

La raíz devuelve JSON y una ruta como `/meteo` no sirve HTML ni una SPA.

## React externo

El backend permite por defecto peticiones REST desde:

```text
http://localhost:5173
```

Esto se configura en `.env`:

```env
CORS_ORIGIN=http://localhost:5173
```

El WebSocket entrega directamente el JSON compatible con el React original, sin envoltorios `tipo` o `value`:

```text
ws://localhost:8080/meteo
```

La API REST sigue siendo independiente y utiliza los datos normalizados guardados en MongoDB para el histórico.

## Importante sobre el modo Demo

El backend ya no sirve React. La aplicación React debe ejecutarse por separado y tener configurada su URL WebSocket al arrancar o compilarse. Para el proyecto original, la URL esperada es:

```env
VITE_METEO_WS_URL=ws://localhost:8080/meteo
```

Esta variable es configuración de la aplicación React; no puede ser inyectada por un backend independiente después de que React haya sido compilado.
