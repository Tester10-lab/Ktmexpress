import React from 'react';

export default function QrScanner({ onScanSuccess, onClose }) {
  return (
    <div style={{ padding: 20, background: 'white', border: '1px solid #ccc', position: 'absolute', zIndex: 1000, top: '10%', left: '50%', transform: 'translateX(-50%)' }}>
      <h4>QR Scanner (Placeholder)</h4>
      <p>This module was missing from the latest commit.</p>
      <button onClick={onClose}>Close Scanner</button>
    </div>
  );
}
