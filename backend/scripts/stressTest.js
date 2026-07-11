import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE = 'http://localhost:5000/api';

async function request(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${endpoint}`, opts);
    const json = await res.json().catch(() => ({}));
    const latency = performance.now() - start;
    return { status: res.status, data: json, latency, success: res.ok };
  } catch (err) {
    const latency = performance.now() - start;
    return { status: 0, error: err.message, latency, success: false };
  }
}

async function run() {
  console.log('=== Ruflo V3 Production Readiness Stress & Performance Test ===');
  
  const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Initial memory usage: ${memBefore.toFixed(2)} MB`);

  // Log in to get tokens
  console.log('Logging in mock roles...');
  const adminRes = await request('POST', '/auth/login', { email: 'qa_admin@ruflo.com', password: 'password123' });
  const adminToken = adminRes.data?.token;

  const vendorRes = await request('POST', '/auth/login', { email: 'qa_vendor1@ruflo.com', password: 'password123' });
  const vendorToken = vendorRes.data?.token;

  const riderRes = await request('POST', '/auth/login', { email: 'qa_rider1@ruflo.com', password: 'password123' });
  const riderToken = riderRes.data?.token;

  const dispatcherRes = await request('POST', '/auth/login', { email: 'qa_dispatcher1@ruflo.com', password: 'password123' });
  const dispatcherToken = dispatcherRes.data?.token;

  if (!adminToken || !vendorToken || !riderToken || !dispatcherToken) {
    console.error('Failed to authenticate users for stress test.');
    process.exit(1);
  }

  // 1. Customer Tracking Load (1000 requests)
  console.log('\n--- Simulating 1000 Concurrent Customer Tracking Actions ---');
  let custSuccess = 0, custFail = 0, custLatencies = [];
  const custPromises = Array.from({ length: 1000 }).map(async (_, i) => {
    // query random tracking code pattern
    const res = await request('GET', `/public/track/QA-TRK-1782589285990-${i % 100}`);
    if (res.success) custSuccess++;
    else custFail++;
    custLatencies.push(res.latency);
  });
  
  const startCust = performance.now();
  await Promise.all(custPromises);
  const durationCust = performance.now() - startCust;

  const avgCustLat = custLatencies.reduce((a, b) => a + b, 0) / custLatencies.length;
  console.log(`Completed in: ${(durationCust / 1000).toFixed(2)}s`);
  console.log(`Successes: ${custSuccess}, Failures: ${custFail}`);
  console.log(`Avg Latency: ${avgCustLat.toFixed(2)} ms`);
  console.log(`Throughput: ${(1000 / (durationCust / 1000)).toFixed(2)} req/sec`);

  // 2. Rider Delivery Queries Load (500 requests)
  console.log('\n--- Simulating 500 Concurrent Rider Query Actions ---');
  let riderSuccess = 0, riderFail = 0, riderLatencies = [];
  const riderPromises = Array.from({ length: 500 }).map(async () => {
    const res = await request('GET', '/rider/deliveries?type=delivery', null, riderToken);
    if (res.success) riderSuccess++;
    else riderFail++;
    riderLatencies.push(res.latency);
  });

  const startRider = performance.now();
  await Promise.all(riderPromises);
  const durationRider = performance.now() - startRider;

  const avgRiderLat = riderLatencies.reduce((a, b) => a + b, 0) / riderLatencies.length;
  console.log(`Completed in: ${(durationRider / 1000).toFixed(2)}s`);
  console.log(`Successes: ${riderSuccess}, Failures: ${riderFail}`);
  console.log(`Avg Latency: ${avgRiderLat.toFixed(2)} ms`);
  console.log(`Throughput: ${(500 / (durationRider / 1000)).toFixed(2)} req/sec`);

  // 3. Vendor Creation & Finance Load (100 requests)
  console.log('\n--- Simulating 100 Concurrent Vendor Operations ---');
  let vendorSuccess = 0, vendorFail = 0, vendorLatencies = [];
  const vendorPromises = Array.from({ length: 100 }).map(async (_, i) => {
    const isCreate = i % 2 === 0;
    let res;
    if (isCreate) {
      res = await request('POST', '/vendor/packages', {
        customerName: `Stress Test ${i}`,
        customerPhone: '9800000000',
        address: 'Kathmandu',
        amount: 250,
        city: 'KTM',
        weight: 0.5
      }, vendorToken);
    } else {
      res = await request('GET', '/vendor/finance', null, vendorToken);
    }
    if (res.success) vendorSuccess++;
    else vendorFail++;
    vendorLatencies.push(res.latency);
  });

  const startVendor = performance.now();
  await Promise.all(vendorPromises);
  const durationVendor = performance.now() - startVendor;

  const avgVendorLat = vendorLatencies.reduce((a, b) => a + b, 0) / vendorLatencies.length;
  console.log(`Completed in: ${(durationVendor / 1000).toFixed(2)}s`);
  console.log(`Successes: ${vendorSuccess}, Failures: ${vendorFail}`);
  console.log(`Avg Latency: ${avgVendorLat.toFixed(2)} ms`);
  console.log(`Throughput: ${(100 / (durationVendor / 1000)).toFixed(2)} req/sec`);

  // 4. Admin & Dispatcher Load (60 requests)
  console.log('\n--- Simulating 50 Dispatchers & 10 Admins ---');
  let staffSuccess = 0, staffFail = 0, staffLatencies = [];
  const staffPromises = Array.from({ length: 60 }).map(async (_, i) => {
    const isAdmin = i < 10;
    const res = isAdmin 
      ? await request('GET', '/admin/dashboard', null, adminToken)
      : await request('GET', '/dispatcher/dashboard', null, dispatcherToken);
    if (res.success) staffSuccess++;
    else staffFail++;
    staffLatencies.push(res.latency);
  });

  const startStaff = performance.now();
  await Promise.all(staffPromises);
  const durationStaff = performance.now() - startStaff;

  const avgStaffLat = staffLatencies.reduce((a, b) => a + b, 0) / staffLatencies.length;
  console.log(`Completed in: ${(durationStaff / 1000).toFixed(2)}s`);
  console.log(`Successes: ${staffSuccess}, Failures: ${staffFail}`);
  console.log(`Avg Latency: ${avgStaffLat.toFixed(2)} ms`);
  console.log(`Throughput: ${(60 / (durationStaff / 1000)).toFixed(2)} req/sec`);

  const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`\nFinal memory usage: ${memAfter.toFixed(2)} MB`);
  console.log(`Memory growth: ${(memAfter - memBefore).toFixed(2)} MB`);

  process.exit(0);
}

run();
