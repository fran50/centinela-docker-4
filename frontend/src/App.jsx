import { Navigate, Route, Routes } from "react-router";
import AppLayout from "./components/AppLayout";
import { navigationItems } from "./data/navigation";
import MeteoPage from "./pages/MeteoPage";
import ResumenPage from "./pages/ResumenPage";
import PlaceholderPage from "./pages/PlaceholderPage";

const pageDescriptions = {
  "/resumen": "Vista general del estado del centro, indicadores principales y actividad reciente.",
  "/aulas": "Control y supervisión de aulas, ocupación, sensores y estado de cada espacio.",
  "/accesos": "Gestión de accesos, puertas, registros de entrada y eventos de seguridad.",
  "/domotica": "Automatización del centro: climatización, iluminación, persianas y dispositivos conectados.",
  "/energia": "Monitorización energética, consumos, producción solar y eficiencia del edificio.",
  "/red": "Estado de la red, conectividad, routers, puntos de acceso e incidencias técnicas.",
  "/automatizaciones": "Reglas automáticas, escenarios programados y respuestas inteligentes del sistema.",
  "/inventario": "Equipamiento tecnológico, dispositivos IoT, activos del centro y mantenimiento.",
  "/alertas": "Avisos activos, incidencias críticas y notificaciones pendientes de revisión.",
  "/informes": "Informes periódicos, métricas históricas y exportación de datos del sistema.",
  "/administracion": "Configuración avanzada, usuarios, permisos y parámetros generales de la plataforma.",
};

function placeholderFor(item) {
  return (
    <PlaceholderPage
      title={item.label}
      icon={item.icon}
      description={pageDescriptions[item.path] ?? "Página preparada para añadir contenido específico."}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/meteo" replace />} />
        {navigationItems.map((item) => (
          <Route
            key={item.path}
            path={item.path.slice(1)}
            element={item.path === "/meteo" ? <MeteoPage /> : item.path === "/resumen" ? <ResumenPage /> : placeholderFor(item)}
          />
        ))}
        <Route path="*" element={<Navigate to="/meteo" replace />} />
      </Route>
    </Routes>
  );
}
