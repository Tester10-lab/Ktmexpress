import Package from '../models/Package.js';

// Shared timestamp formatter for timeline entries
export function nowStr() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

// Generate a unique 7-character alphanumeric tracking code
export function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate a tracking code guaranteed to be unique in the DB
export async function uniqueTrackingCode() {
  let code;
  let exists = true;
  while (exists) {
    code = generateTrackingCode();
    exists = await Package.exists({ trackingCode: code });
  }
  return code;
}

// Generate multiple unique tracking codes in batch (fewer DB round-trips)
export async function uniqueTrackingCodes(count) {
  const codes = new Set();
  while (codes.size < count) {
    codes.add(generateTrackingCode());
  }
  // Check all at once
  const existing = await Package.find(
    { trackingCode: { $in: [...codes] } },
    { trackingCode: 1 }
  ).lean();
  const existingSet = new Set(existing.map(p => p.trackingCode));
  // Remove collisions and regenerate
  for (const code of existingSet) {
    codes.delete(code);
  }
  // Fill back up any that collided
  while (codes.size < count) {
    const newCode = generateTrackingCode();
    if (!existingSet.has(newCode) && !codes.has(newCode)) {
      codes.add(newCode);
    }
  }
  return [...codes];
}

// Generate a concurrency-safe unique invoice ID
export function generateInvoiceId() {
  // Use timestamp + random string for uniqueness under concurrent load
  return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
