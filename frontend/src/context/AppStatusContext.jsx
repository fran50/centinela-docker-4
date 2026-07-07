import { createContext, useContext, useMemo, useState } from "react";

const AppStatusContext = createContext(null);

export function AppStatusProvider({ children }) {
  const [status, setStatus] = useState(import.meta.env.VITE_METEO_WS_URL ? "connecting" : "demo");
  const [detail, setDetail] = useState(import.meta.env.VITE_METEO_WS_URL ? "Abriendo WebSocket" : "Sin VITE_METEO_WS_URL");
  const value = useMemo(() => ({ status, setStatus, detail, setDetail }), [status, detail]);
  return <AppStatusContext.Provider value={value}>{children}</AppStatusContext.Provider>;
}

export function useAppStatus() {
  const value = useContext(AppStatusContext);
  if (!value) throw new Error("useAppStatus debe usarse dentro de AppStatusProvider");
  return value;
}
