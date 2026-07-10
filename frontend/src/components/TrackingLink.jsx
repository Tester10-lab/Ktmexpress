import React from 'react';

/**
 * Renders a tracking code as a clickable link to the tracking page.
 */
export default function TrackingLink({ code }) {
  if (!code) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
  return (
    <a
      href={`/tracking?code=${code}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#2563eb',
        fontWeight: 600,
        fontSize: 12,
        textDecoration: 'none',
        fontFamily: 'monospace',
        letterSpacing: '0.02em',
      }}
      onMouseOver={e => (e.target.style.textDecoration = 'underline')}
      onMouseOut={e => (e.target.style.textDecoration = 'none')}
    >
      {code}
    </a>
  );
}
