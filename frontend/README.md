# Centinela-SmartRiberIA Meteo · Vite + React Router

Proyecto React/Vite con rutas multipágina y una página Meteo preparada para recibir datos por WebSocket cada 2-3 segundos.

## Arranque

```bash
npm install
npm run dev
```

## WebSocket real

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_METEO_WS_URL=ws://localhost:8080/meteo
```

Si no defines `VITE_METEO_WS_URL`, la página funciona en modo demo generando lecturas simuladas cada 2,5 segundos para que puedas ver las animaciones y las gráficas.

## JSON esperado

La página acepta mensajes WebSocket como JSON puro o como texto que contenga un objeto JSON. Por ejemplo:

```json
{
  "temperatura": 20.7,
  "temp_max_dia": 20.7,
  "temp_min_dia": 17.8,
  "temp_max_mes": 35.8,
  "temp_min_mes": 16.4,
  "temp_max_ano": 37.6,
  "temp_min_ano": 4.4,
  "humidity": 28,
  "pressure": "unknown",
  "densidad": 1.15,
  "punto_de_rocio": "light_air",
  "Sensacion_Termica": "22.2 ",
  "Temperatura_interior": 38.5,
  "Esta_Nevando": "off",
  "Esta_lloviendo": "off",
  "Precipitacion_del_Mes": 6.8,
  "Precipitacion_del_Año": 82.5,
  "Precipitacion_ultimas_24h": 6.8,
  "Tasa_Precipitacion": 0.0,
  "Cantidad_lluvia_hoy": 3.5,
  "Tendencia_en_la_presion": "falling",
  "rayos_UV": "unknown",
  "Indice_UV": "unknown",
  "Visibilidad": 20.9,
  "Direccion_del_viento": "ne",
  "Sensacion_terminca_por_Viento": 20.7,
  "Direccion_del_viento_Grados": 49,
  "Rafagas_del_viento": "5.04",
  "velocidad_del_viento": 3.6
}
```

## Archivos principales

- `src/pages/MeteoPage.jsx`: página Meteo responsive.
- `src/hooks/useMeteoWebSocket.js`: conexión WebSocket, reconexión, modo demo e histórico local.
- `src/utils/meteo.js`: normalización del JSON, parseo de `unknown`, números como texto y helpers de formato.
- `src/components/meteo/MetricCard.jsx`: tarjetas de métrica con animación cuando cambia el valor.
- `src/components/meteo/WeatherCharts.jsx`: gráficas con Recharts.
- `src/components/meteo/WindCompass.jsx`: brújula de viento animada.
- `src/components/meteo/GaugeCard.jsx`: gauge circular reutilizable.

## Build

```bash
npm run build
```

Nota: al usar Recharts, Vite puede avisar de chunk grande. No impide compilar. Más adelante se puede optimizar con lazy loading de la página Meteo.

## Configuración de Meteo Real e Histórico

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

- `VITE_METEO_WS_URL`: activa el modo Vivo mediante WebSocket.
- `VITE_METEO_API_URL`: URL del backend REST para consultas históricas.

La barra superior muestra: Demo, Conectando, Vivo, Sin conexión, Error o Histórico.
El selector Real/Histórico mantiene los mismos componentes meteorológicos.

## Vista histórica gráfica

La vista Histórico consulta una serie por variable mediante `GET /api/series` y combina las respuestas por fecha. Presenta:

- Medias, mínimos y máximos de temperatura, humedad y presión.
- Precipitación total, porcentaje y horas estimadas con lluvia.
- Velocidad media y máxima del viento, además de la ráfaga máxima.
- Índice UV medio y máximo.
- Gráficas de temperatura, precipitación acumulada, humedad, presión, viento y variables ambientales.
- Cobertura media de los datos devuelta por la API.

Variables necesarias: `temperatura_exterior_c`, `temperatura_interior_c`, `humedad_relativa_pct`, `presion_hpa`, `punto_rocio_c`, `sensacion_termica_c`, `velocidad_viento_kmh`, `rafaga_viento_kmh`, `visibilidad_km`, `indice_uv`, `tasa_precipitacion_mm_h`, `precipitacion_intervalo_mm`, `direccion_viento_grados`, `esta_lloviendo` y `esta_nevando`.

## Paleta oscura personalizada

La vista oscura utiliza la siguiente paleta:

- Fondo general: `#15151F`
- Tarjetas y paneles: `#28283D`
- Superficie secundaria: `#222234`
- Bordes: `#3D3D5C`
- Texto principal: `#FFFFFF`
- Texto secundario: `#A0A0B8`
- Color primario: `#00BFFF`

La vista clara no se modifica.

## Página Resumen

La ruta `/resumen` contiene ahora la vista general del centro dividida en componentes:

- `src/pages/ResumenPage.jsx`: composición de la página.
- `src/components/resumen/SummaryGrid.jsx`: rejilla de indicadores.
- `src/components/resumen/SummaryCard.jsx`: tarjeta KPI reutilizable.
- `src/components/resumen/OverviewCharts.jsx`: sección de gráficos.
- `src/components/resumen/OccupancyChart.jsx`: ocupación por horas.
- `src/components/resumen/FloorTemperatureChart.jsx`: temperatura por planta.
- `src/components/resumen/ClassroomMap.jsx`: mapa y leyenda de aulas.
- `src/components/resumen/ClassroomTile.jsx`: celda reutilizable de aula.
- `src/data/resumenData.js`: datos de demostración separados de la presentación.
