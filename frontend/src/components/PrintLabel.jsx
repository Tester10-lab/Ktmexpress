import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../store/SettingsContext';
import brandLogo from '../assets/logo.png';

/**
 * PrintLabel Component
 * Renders print-optimized A6 shipping labels for one or more packages.
 * Triggered by window.print() — labels are hidden from screen, only visible when printing.
 *
 * Usage:
 *   const printRef = useRef();
 *   <PrintLabel ref={printRef} packages={[pkg1, pkg2]} />
 *   <button onClick={() => { printRef.current.print(); }}>Print</button>
 */

const COMPANY_NAME = 'ktmexpress';
const COMPANY_TAGLINE = 'Swift. Safe. Delivered.';

const statusColor = (status) => {
  if (status === 'Delivered') return '#065f46';
  if (status === 'Cancelled') return '#991b1b';
  if (['Returned', 'Returned to Vendor'].includes(status)) return '#1e40af';
  return '#1e3a8a';
};

const LabelCard = ({ pkg }) => {
  const { logoUrl } = useSettings();
  const trackingBase = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const qr = pkg.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=160x160&ecc=M&data=${encodeURIComponent(`${trackingBase}/track?code=${pkg.trackingCode}`)}`;
  const barcode = pkg.barcodeUrl || `https://barcodeapi.org/api/128/${pkg.trackingCode}`;
  const deliveryDate = pkg.deliveryDate ? new Date(pkg.deliveryDate).toLocaleDateString() : '—';

  return (
    <div className="label-card">
      {/* Header */}
      <div className="label-header">
        <div className="label-logo">
          {logoUrl ? (
            <img src={logoUrl} alt={COMPANY_NAME} className="h-6 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = brandLogo; }} />
          ) : (
            <img src={brandLogo} alt={COMPANY_NAME} className="h-6 object-contain" />
          )}
        </div>
        <div className="label-tagline">{COMPANY_TAGLINE}</div>
      </div>

      {/* Status + Tracking code banner */}
      <div className="label-status-bar" style={{ backgroundColor: statusColor(pkg.status) }}>
        <span className="label-tracking-code">{pkg.trackingCode}</span>
        <span className="label-status-text">{pkg.status?.toUpperCase()}</span>
      </div>

      {/* Barcode full-width */}
      <div className="label-barcode-section">
        <img src={barcode} alt={`Barcode for ${pkg.trackingCode}`} className="label-barcode-img" />
      </div>

      {/* Main content: address + QR */}
      <div className="label-body">
        <div className="label-address-section">
          <div className="label-section-title">RECIPIENT</div>
          <div className="label-customer-name">{pkg.customerName}</div>
          <div className="label-customer-phone">📞 {pkg.customerPhone}</div>
          <div className="label-customer-address">
            {pkg.city ? `${pkg.city}, ` : ''}{pkg.address}
            {pkg.outOfValley && <span className="label-ov-badge"> [OUTSIDE VALLEY]</span>}
          </div>
          
          <div className="label-meta-row">
            <div className="label-meta-item">
              <span className="label-meta-label">INV #</span>
              <span className="label-meta-value">{pkg.invoiceId || '—'}</span>
            </div>
            <div className="label-meta-item">
              <span className="label-meta-label">WEIGHT</span>
              <span className="label-meta-value">{pkg.weight || 0} kg</span>
            </div>
          </div>
          <div className="label-meta-row">
            <div className="label-meta-item">
              <span className="label-meta-label">COD</span>
              <span className="label-meta-value label-cod">Rs. {pkg.amount}</span>
            </div>
            <div className="label-meta-item">
              <span className="label-meta-label">DELIVER BY</span>
              <span className="label-meta-value">{deliveryDate}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="label-qr-section">
          <img src={qr} alt={`QR for ${pkg.trackingCode}`} className="label-qr-img" />
          <div className="label-qr-caption">Scan to Track</div>
        </div>
      </div>

      {/* Footer */}
      <div className="label-footer">
        <span>Delivery Charge: Rs. {pkg.deliveryCharge || 0}</span>
        <span>Generated: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// The actual print trigger + wrapper
const PrintLabel = React.forwardRef(({ packages = [] }, ref) => {
  const containerRef = useRef(null);

  // Expose print method to parent
  React.useImperativeHandle(ref, () => ({
    print: () => window.print(),
  }));

  if (!packages.length) return null;

  return createPortal(
    <div ref={containerRef} className="print-only print-label-container">
      {packages.map((pkg, idx) => (
        <LabelCard key={pkg._id || idx} pkg={pkg} />
      ))}
    </div>,
    document.body
  );
});

PrintLabel.displayName = 'PrintLabel';

export default PrintLabel;
