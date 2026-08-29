import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../store/SettingsContext';
import brandLogo from '../assets/logo.png';
import Barcode128 from '../utils/barcode128';

/**
 * 4x6 Inch Thermal Courier Shipping Label Component
 * Optimized for thermal printers (100mm x 150mm / 4in x 6in) and standard printers.
 * Renders dynamically from database package data.
 */

const COMPANY_DEFAULT_NAME = 'KDM EXPRESS';
const COMPANY_DEFAULT_TAGLINE = 'Swift. Safe. Delivered.';
const COMPANY_HELPLINE = '+977-9800000000';
const COMPANY_WEBSITE = 'www.kdmexpress.com';

export const CourierLabelCard = ({ pkg }) => {
  const { settings, logoUrl } = useSettings();

  const companyName = settings?.companyName || COMPANY_DEFAULT_NAME;
  const companyTagline = settings?.tagline || COMPANY_DEFAULT_TAGLINE;
  const helpline = settings?.supportPhone || settings?.phone || COMPANY_HELPLINE;
  const website = settings?.website || COMPANY_WEBSITE;

  const trackingBase = (import.meta.env.VITE_PUBLIC_URL && !import.meta.env.VITE_PUBLIC_URL.includes('localhost'))
    ? import.meta.env.VITE_PUBLIC_URL
    : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'https://kdmexpress.com'
      : (typeof window !== 'undefined' ? window.location.origin : 'https://kdmexpress.com'));

  const trackingCode = pkg.trackingCode || 'TRK-UNKNOWN';
  const invoiceId = pkg.invoiceId || pkg.orderId || '—';
  const trackingUrl = `${trackingBase}/track?code=${trackingCode}`;

  // QR Code URL with fallback
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=2&ecc=M&data=${encodeURIComponent(trackingUrl)}`;

  // Sender / Vendor details
  const senderName = pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name || pkg.vendorName || 'Sender / Vendor';
  const senderPhone = pkg.vendorId?.contact || pkg.vendorId?.phone || pkg.vendorContact || pkg.vendorPhone || '—';
  const senderCity = pkg.vendorId?.city || 'Kathmandu';

  // Recipient details
  const recipientName = pkg.customerName || 'Valued Customer';
  const recipientPhone = pkg.customerPhone || '—';
  const recipientAddress = pkg.address || 'Standard Delivery Address';
  const recipientCity = pkg.city || (pkg.outOfValley ? 'Outside Valley' : 'Kathmandu Valley');

  // Destination Routing
  const destinationHeader = (pkg.city || (pkg.outOfValley ? 'OUTSIDE VALLEY' : 'KATHMANDU VALLEY')).toUpperCase();
  const isOutOfValley = Boolean(pkg.outOfValley);

  // Financials & Payment
  const codAmount = Number(pkg.amount || 0);
  const deliveryCharge = Number(pkg.deliveryCharge || 0);
  const paymentType = pkg.paymentMethod || (codAmount > 0 ? 'CASH ON DELIVERY (COD)' : 'PREPAID');
  const isCOD = codAmount > 0 && !['Prepaid', 'Paid'].includes(pkg.paymentMethod);

  // Rider info
  const riderName = pkg.riderId?.name || (typeof pkg.riderId === 'string' ? pkg.riderId : '') || 'Assigned Courier';

  // Format Date
  const printDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const printTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Items / Instructions
  const itemsList = Array.isArray(pkg.items) && pkg.items.length > 0
    ? pkg.items.map(item => `${item.name}${item.qty ? ` (x${item.qty})` : ''}`).join(', ')
    : (pkg.description || pkg.packageAccess === 'open' ? 'Standard package (Open on delivery)' : 'Standard Courier Parcel');

  return (
    <div className="courier-label-page">
      <div className="courier-label-border">
        
        {/* ── HEADER: BRANDING & SERVICE ── */}
        <div className="label-row label-header-row">
          <div className="label-brand-block">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="label-brand-logo"
                onError={(e) => { e.target.onerror = null; e.target.src = brandLogo; }}
              />
            ) : (
              <img src={brandLogo} alt={companyName} className="label-brand-logo" />
            )}
            <div className="label-brand-text">
              <div className="label-company-name">{companyName}</div>
              <div className="label-company-tagline">{companyTagline}</div>
            </div>
          </div>
          <div className="label-service-badge-block">
            <span className="label-service-type">EXPRESS COURIER</span>
            <span className="label-datetime">{printDate} {printTime}</span>
          </div>
        </div>

        {/* ── ROUTING / DESTINATION BANNER ── */}
        <div className="label-routing-banner">
          <div className="label-routing-dest">
            <span className="label-small-tag">DESTINATION:</span>
            <span className="label-dest-name">{destinationHeader}</span>
          </div>
          <div className="label-routing-zone">
            <span className={`label-zone-badge ${isOutOfValley ? 'zone-ov' : 'zone-ktm'}`}>
              {isOutOfValley ? 'OUTSIDE VALLEY' : 'INSIDE VALLEY'}
            </span>
          </div>
        </div>

        {/* ── BARCODE & TRACKING CODE SECTION ── */}
        <div className="label-barcode-container">
          <div className="label-barcode-graphic">
            <Barcode128 value={trackingCode} height={52} barWidth={2} />
          </div>
          <div className="label-tracking-details">
            <div className="label-tracking-number">{trackingCode}</div>
            <div className="label-invoice-ref">Order / Inv Ref: <strong>{invoiceId}</strong></div>
          </div>
        </div>

        {/* ── SENDER & RECEIVER TWO-COLUMN GRID ── */}
        <div className="label-grid-row">
          {/* FROM SECTION */}
          <div className="label-grid-col label-col-sender">
            <div className="label-grid-header">FROM (SENDER / VENDOR)</div>
            <div className="label-party-name">{senderName}</div>
            <div className="label-party-phone">📞 {senderPhone}</div>
            <div className="label-party-sub">Hub/Origin: {senderCity}</div>
          </div>

          {/* TO SECTION */}
          <div className="label-grid-col label-col-receiver">
            <div className="label-grid-header">TO (RECIPIENT / CONSIGNEE)</div>
            <div className="label-party-name bold-recipient">{recipientName}</div>
            <div className="label-party-phone bold-phone">📞 {recipientPhone}</div>
            <div className="label-party-address">
              {recipientAddress}
              {recipientCity ? `, ${recipientCity}` : ''}
            </div>
          </div>
        </div>

        {/* ── SHIPMENT SPECIFICATIONS ROW ── */}
        <div className="label-specs-row">
          <div className="label-spec-cell">
            <span className="label-spec-k">WEIGHT:</span>
            <span className="label-spec-v">{pkg.weight || 0.5} kg</span>
          </div>
          <div className="label-spec-cell">
            <span className="label-spec-k">ACCESS:</span>
            <span className="label-spec-v uppercase">{pkg.packageAccess || 'Sealed'}</span>
          </div>
          <div className="label-spec-cell">
            <span className="label-spec-k">RIDER:</span>
            <span className="label-spec-v">{riderName}</span>
          </div>
          <div className="label-spec-cell">
            <span className="label-spec-k">STATUS:</span>
            <span className="label-spec-v uppercase">{pkg.status || 'Dispatched'}</span>
          </div>
        </div>

        {/* ── PAYMENT & COD HIGHLIGHT BOX ── */}
        <div className={`label-cod-banner ${isCOD ? 'cod-highlight' : 'prepaid-highlight'}`}>
          <div className="label-cod-left">
            <span className="label-cod-mode-tag">
              {isCOD ? 'CASH ON DELIVERY (COD)' : 'PREPAID SHIPMENT'}
            </span>
            <span className="label-cod-currency-note">
              {isCOD ? 'Please collect exact cash from customer' : 'Package already paid - do not collect COD'}
            </span>
          </div>
          <div className="label-cod-right">
            <span className="label-cod-amount-label">AMOUNT TO COLLECT</span>
            <span className="label-cod-amount-val">
              {isCOD ? `Rs. ${codAmount.toLocaleString()}` : 'Rs. 0.00'}
            </span>
          </div>
        </div>

        {/* ── QR CODE & CONTENTS / INSTRUCTIONS ── */}
        <div className="label-footer-grid">
          <div className="label-qr-block">
            <img
              src={qrUrl}
              alt={`QR ${trackingCode}`}
              className="label-qr-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://quickchart.io/qr?size=180&text=${encodeURIComponent(trackingUrl)}`;
              }}
            />
            <div className="label-qr-hint">Scan to Track</div>
          </div>
          <div className="label-instructions-block">
            <div className="label-sub-heading">ITEMS / SPECIAL INSTRUCTIONS</div>
            <div className="label-items-text">{itemsList}</div>
            {deliveryCharge > 0 && (
              <div className="label-delivery-fee-note">
                Delivery Charge: Rs. {deliveryCharge} {isCOD ? '(Included in COD)' : ''}
              </div>
            )}
            <div className="label-caution-note">
              ⚠️ Handle with care. Verify recipient identity upon delivery.
            </div>
          </div>
        </div>

        {/* ── FINAL BOTTOM BRAND FOOTER ── */}
        <div className="label-bottom-footer">
          <span>Helpline: <strong>{helpline}</strong></span>
          <span>Tracking: <strong>{website}</strong></span>
          <span>Authorized Shipping Label</span>
        </div>

      </div>
    </div>
  );
};

/**
 * PrintLabel Component
 * Exposes ref.print() and renders full courier labels into a portal for window.print()
 */
const PrintLabel = React.forwardRef(({ packages = [] }, ref) => {
  const containerRef = useRef(null);

  React.useImperativeHandle(ref, () => ({
    print: () => {
      // Small timeout ensures react portal rendered DOM nodes before print dialog
      setTimeout(() => {
        window.print();
      }, 50);
    },
  }));

  const pkgList = Array.isArray(packages) ? packages.filter(Boolean) : (packages ? [packages] : []);

  if (!pkgList.length) return null;

  return createPortal(
    <div ref={containerRef} className="print-label-portal">
      {pkgList.map((pkg, idx) => (
        <CourierLabelCard key={pkg._id || pkg.trackingCode || idx} pkg={pkg} />
      ))}
    </div>,
    document.body
  );
});

PrintLabel.displayName = 'PrintLabel';

export default PrintLabel;
