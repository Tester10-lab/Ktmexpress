/**
 * useZoom — Manages page zoom level with localStorage persistence per device type.
 *
 * - Range: 70% to 150% (step 10%)
 * - Applies via CSS transform scale on #root (avoids layout bugs vs. zoom property)
 * - Keyboard: Ctrl/Cmd + Plus/Minus/Zero
 * - Persists per device type: exd_zoom_desktop, exd_zoom_tablet, etc.
 */
import { useState, useEffect, useCallback } from 'react';
import { useDeviceType } from './useDeviceType';

const MIN_ZOOM = 70;
const MAX_ZOOM = 150;
const STEP = 10;

function storageKey(deviceType) {
  return `exd_zoom_${deviceType}`;
}

function getInitialZoom(deviceType) {
  try {
    const stored = localStorage.getItem(storageKey(deviceType));
    if (stored) {
      const n = parseInt(stored, 10);
      if (n >= MIN_ZOOM && n <= MAX_ZOOM) return n;
    }
  } catch (_) {}
  return 100;
}

function applyZoom(zoom) {
  const root = document.getElementById('root');
  if (!root) return;
  if (zoom === 100) {
    root.style.transform = '';
    root.style.transformOrigin = '';
    root.style.width = '';
    root.style.minHeight = '';
  } else {
    const scale = zoom / 100;
    root.style.transform = `scale(${scale})`;
    root.style.transformOrigin = 'top left';
    root.style.width = `${100 / scale}%`;
    root.style.minHeight = `${100 / scale}vh`;
  }
}

export function useZoom() {
  const deviceType = useDeviceType();
  const [zoom, setZoomState] = useState(() => getInitialZoom(deviceType));

  // Persist & apply whenever zoom or deviceType changes
  useEffect(() => {
    applyZoom(zoom);
    try { localStorage.setItem(storageKey(deviceType), String(zoom)); } catch (_) {}
  }, [zoom, deviceType]);

  // Re-read from storage when device type changes (e.g., window resize)
  useEffect(() => {
    const saved = getInitialZoom(deviceType);
    setZoomState(saved);
  }, [deviceType]);

  const setZoom = useCallback((value) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    setZoomState(clamped);
  }, []);

  const zoomIn  = useCallback(() => setZoom(zoom + STEP), [zoom, setZoom]);
  const zoomOut = useCallback(() => setZoom(zoom - STEP), [zoom, setZoom]);
  const resetZoom = useCallback(() => setZoom(100), [setZoom]);

  // Keyboard shortcuts: Ctrl/Cmd + Plus / Minus / Zero
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); resetZoom(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomIn, zoomOut, resetZoom]);

  const canZoomIn  = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  return { zoom, zoomIn, zoomOut, resetZoom, setZoom, canZoomIn, canZoomOut, MIN_ZOOM, MAX_ZOOM };
}

export default useZoom;
