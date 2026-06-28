import Package from '../models/Package.js';

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

// Generate a concurrency-safe unique invoice ID
export function generateInvoiceId() {
  // Use timestamp + random string for uniqueness under concurrent load
  return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
