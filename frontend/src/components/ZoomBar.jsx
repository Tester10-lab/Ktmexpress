/**
 * ZoomBar — Floating zoom control bar (desktop only, hidden on mobile).
 * Position: bottom-right, fixed.
 * Controls: zoom out, current %, zoom in, reset.
 * Keyboard shortcuts: Ctrl+Plus / Ctrl+Minus / Ctrl+0
 */
import React, { useState } from 'react';
import { useZoom } from '../hooks/useZoom';
import { useIsMobileOrTablet } from '../hooks/useDeviceType';

const ZoomBar = () => {
  const { zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = useZoom();
  const isMobileOrTablet = useIsMobileOrTablet();
  const [hovered, setHovered] = useState(false);

  // Hide on mobile/tablet — native pinch zoom is better there
  if (isMobileOrTablet) return null;

  return (
    <div
      className="zoom-bar"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-full)',
        padding: '5px 8px',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(12px)',
        opacity: hovered ? 1 : 0.65,
        transition: 'opacity 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        userSelect: 'none',
      }}
      aria-label="Page zoom controls"
      role="group"
    >
      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        disabled={!canZoomOut}
        title="Zoom Out (Ctrl+−)"
        aria-label="Zoom out"
        style={{
          width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', border: 'none', cursor: canZoomOut ? 'pointer' : 'not-allowed',
          background: 'transparent', color: canZoomOut ? 'var(--text-secondary)' : 'var(--text-muted)',
          transition: 'background 0.15s, color 0.15s',
          fontSize: 16, fontWeight: 700, lineHeight: 1,
        }}
        onMouseEnter={e => { if (canZoomOut) e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        −
      </button>

      {/* Current Zoom % */}
      <button
        onClick={resetZoom}
        title="Reset Zoom (Ctrl+0)"
        aria-label={`Current zoom: ${zoom}%. Click to reset.`}
        style={{
          minWidth: 44, height: 28, padding: '0 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
          background: zoom !== 100 ? 'var(--color-primary-soft)' : 'transparent',
          color: zoom !== 100 ? 'var(--color-primary)' : 'var(--text-secondary)',
          fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
          transition: 'background 0.15s, color 0.15s',
          letterSpacing: '0.02em',
        }}
      >
        {zoom}%
      </button>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        disabled={!canZoomIn}
        title="Zoom In (Ctrl++)"
        aria-label="Zoom in"
        style={{
          width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', border: 'none', cursor: canZoomIn ? 'pointer' : 'not-allowed',
          background: 'transparent', color: canZoomIn ? 'var(--text-secondary)' : 'var(--text-muted)',
          transition: 'background 0.15s, color 0.15s',
          fontSize: 16, fontWeight: 700, lineHeight: 1,
        }}
        onMouseEnter={e => { if (canZoomIn) e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        +
      </button>
    </div>
  );
};

export default ZoomBar;
