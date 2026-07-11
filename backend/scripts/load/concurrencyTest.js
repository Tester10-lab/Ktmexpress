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

  try {
    const res = await fetch(`${BASE}${endpoint}`, opts);
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function run() {
  console.log('--- Ruflo V3 Concurrency & Race Condition Test ---');

  // Login as Vendor
  const loginRes = await request('POST', '/auth/login', {
    email: 'qa_vendor1@ruflo.com',
    password: 'password123'
  });
  const token = loginRes.data?.token;
  if (!token) {
    console.error('Failed to log in as qa_vendor1@ruflo.com');
    process.exit(1);
  }
  console.log('Logged in as Vendor successfully.');

  // Find delivered packages for this vendor
  const financeRes = await request('GET', '/vendor/finance', null, token);
  console.log('Finance status:', JSON.stringify(financeRes.data));
  const pendingCOD = financeRes.data?.data?.pendingCOD || 0;
  const pendingCount = financeRes.data?.data?.pendingPackagesCount || 0;

  if (pendingCount === 0) {
    console.log('No pending packages to settle. Let\'s deliver some packages first to simulate concurrency.');
    // Let's log in as admin and mark a few packages as Delivered + Cash Reconciled
    const adminLogin = await request('POST', '/auth/login', {
      email: 'qa_admin@ruflo.com',
      password: 'password123'
    });
    const adminToken = adminLogin.data?.token;
    if (!adminToken) {
      console.error('Failed to log in as admin');
      process.exit(1);
    }
    
    // Get vendor details
    const profileRes = await request('GET', '/auth/profile', null, token);
    const vendorId = profileRes.data?.user?.id;

    // Create 5 packages for this vendor
    console.log('Creating 5 mock packages to deliver...');
    const packageIds = [];
    for (let i = 0; i < 5; i++) {
      const pkgRes = await request('POST', '/vendor/packages', {
        customerName: `Conc Customer ${i}`,
        customerPhone: '9876543210',
        address: 'Kathmandu',
        amount: 1000 + i * 100,
        city: 'KTM',
        weight: 0.5
      }, token);
      if (pkgRes.data?.success) {
        packageIds.push(pkgRes.data.data._id);
      }
    }

    console.log(`Created ${packageIds.length} packages. Marking as Delivered and Cash Reconciled...`);
    for (const pkgId of packageIds) {
      // Direct update package status via admin endpoint if possible or rider
      // Admin updatePackageAdmin or through dispatcher
      // Let's just use the direct MongoDB seed update or admin routes if available.
      // Wait, is there a direct admin package status update? Let's check routes in adminRoutes.
      // Admin has updatePackageAdmin (PUT /api/admin/packages/:id)
      // Let's check what fields can be updated: customerName, customerPhone, address, city, amount, weight, deliveryDate
      // Wait, does updatePackageAdmin let us update 'status' or 'cashReconciled'?
      // Let's look at adminController.js line 303:
      // const { customerName, customerPhone, address, city, amount, weight, deliveryDate } = req.body;
      // Ah! It doesn't let us update 'status' directly!
      // How do we update status? Let's check if dispatcher or rider can.
      // Rider can update status to 'Delivered' via PUT /api/rider/update-status!
      // But we need to assign it to rider first.
      // Let's do it programmatically using a seed script, or check if we can directly invoke a helper endpoint.
      // Actually, we can run a quick DB script to update package status directly, then run the concurrency HTTP tests.
    }
  }

  // If we already have packages ready to settle, let's run concurrent settlement requests!
  console.log('Sending 5 concurrent settlement requests...');
  const promises = Array.from({ length: 5 }).map(() => 
    request('POST', '/vendor/settlements', {}, token)
  );

  const results = await Promise.all(promises);
  console.log('Concurrent Settlement Requests Results:');
  results.forEach((res, i) => {
    console.log(`Request #${i + 1}: Status: ${res.status}, Response:`, JSON.stringify(res.data));
  });

  // Check how many settlements were created
  const settlementsRes = await request('GET', '/vendor/settlements', null, token);
  console.log('Total Settlements list:', JSON.stringify(settlementsRes.data));
  
  process.exit(0);
}

run();
