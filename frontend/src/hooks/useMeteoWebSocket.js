import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMockReading, SAMPLE_METEO_READING } from "../data/meteoSample";
import { extractJsonPayload, normalizeMeteoReading } from "../utils/meteo";

const MAX_HISTORY_POINTS = 40;
const MOCK_INTERVAL_MS = 2500;

export default function useMeteoWebSocket({ url, maxHistory = MAX_HISTORY_POINTS, simulateWhenMissingUrl = true } = {}) {
  const initialReading = useMemo(() => normalizeMeteoReading(SAMPLE_METEO_READING), []);
  const [reading, setReading] = useState(initialReading);
  const [previousReading, setPreviousReading] = useState(null);
  const [history, setHistory] = useState([initialReading]);
  const [status, setStatus] = useState(url ? "connecting" : "demo");
  const [error, setError] = useState(null);
  const reconnectTimer = useRef(null);
  const socketRef = useRef(null);
  const readingRef = useRef(initialReading);
  const lastMockRaw = useRef(SAMPLE_METEO_READING);

  const pushRawReading = useCallback((raw) => {
    const normalized = normalizeMeteoReading(raw);
    setPreviousReading(readingRef.current);
    setReading(normalized);
    readingRef.current = normalized;
    setHistory((current) => [...current.slice(-(maxHistory - 1)), normalized]);
  }, [maxHistory]);

  useEffect(() => {
    if (!url && simulateWhenMissingUrl) {
      setStatus("demo");
      const interval = window.setInterval(() => {
        lastMockRaw.current = createMockReading(lastMockRaw.current);
        pushRawReading(lastMockRaw.current);
      }, MOCK_INTERVAL_MS);

      return () => window.clearInterval(interval);
    }

    if (!url) return undefined;

    let cancelled = false;

    function connect() {
      if (cancelled) return;
      setStatus("connecting");
      setError(null);
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        if (!cancelled) setStatus("live");
      });

      socket.addEventListener("message", (event) => {
        try {
          pushRawReading(extractJsonPayload(event.data));
          setStatus("live");
        } catch (exception) {
          setError(exception.message);
        }
      });

      socket.addEventListener("close", () => {
        if (cancelled) return;
        setStatus("offline");
        reconnectTimer.current = window.setTimeout(connect, 3000);
      });

      socket.addEventListener("error", () => {
        if (!cancelled) {
          setStatus("error");
          setError("No se pudo conectar con el WebSocket de Meteo");
        }
      });
    }

    connect();

    return () => {
      cancelled = true;
      window.clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
    };
  }, [url, simulateWhenMissingUrl, pushRawReading]);

  return { reading, previousReading, history, status, error };
}
