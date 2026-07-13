import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Package from './models/Package.js';
import User from './models/User.js';
import { getAllPackages } from './controllers/packageController.js';

async function runTests() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'testdb' });

  // Create Users
  const vendor1 = await User.create({ name: 'Personal Vendor', role: 'vendor', vendorMeta: { shopName: 'Shop A' }, email: 'v1@test.com', password: 'password123' });
  const vendor2 = await User.create({ name: 'Another Vendor', role: 'vendor', vendorMeta: { shopName: 'Shop B' }, email: 'v2@test.com', password: 'password123' });
  const rider1 = await User.create({ name: 'Rider 1', role: 'rider', email: 'r1@test.com', password: 'password123' });
  const rider2 = await User.create({ name: 'Rider 2', role: 'rider', email: 'r2@test.com', password: 'password123' });

  // Create Packages
  await Package.create({
    trackingCode: 'TRACK100',
    invoiceId: 'INV-100',
    vendorId: vendor1._id,
    customerName: 'John Doe',
    customerPhone: '1234567890',
    address: '123 St',
    amount: 100,
    status: 'Pending',
    riderId: rider1._id,
    createdAt: new Date('2025-01-01T10:00:00Z')
  });

  await Package.create({
    trackingCode: 'TRACK200',
    invoiceId: 'INV-200',
    vendorId: vendor2._id,
    customerName: 'Jane Smith',
    customerPhone: '0987654321',
    address: '456 Ave',
    amount: 200,
    status: 'Delivered',
    riderId: rider2._id,
    createdAt: new Date('2025-01-10T10:00:00Z')
  });

  // Mock Request/Response
  const makeReq = (query) => ({ query });
  const mockRes = () => {
    let result = null;
    return {
      json: (data) => { result = data; },
      status: (code) => ({ json: (data) => { result = { error: data, code }; } }),
      getResult: () => result
    };
  };

  const testCases = [
    { name: 'No Filters (All)', query: {}, expectedCount: 2 },
    { name: 'Status Filter', query: { status: 'Pending' }, expectedCount: 1 },
    { name: 'Date Range (From/To)', query: { startDate: '2025-01-01', endDate: '2025-01-05' }, expectedCount: 1 },
    { name: 'Tracking Code', query: { trackingCode: '200' }, expectedCount: 1 },
    { name: 'Vendor (ID)', query: { vendor: vendor1._id.toString() }, expectedCount: 1 },
    { name: 'Customer Name', query: { customer: 'Jane' }, expectedCount: 1 },
    { name: 'Customer Phone', query: { customer: '1234' }, expectedCount: 1 },
    { name: 'Rider (ID)', query: { rider: rider2._id.toString() }, expectedCount: 1 },
    { name: 'Combination AND (Status+Rider)', query: { status: 'Delivered', rider: rider2._id.toString() }, expectedCount: 1 },
    { name: 'Combination None Match', query: { status: 'Pending', rider: rider2._id.toString() }, expectedCount: 0 },
    { name: 'Pagination (limit 1)', query: { limit: '1' }, expectedCount: 1 },
  ];

  for (const tc of testCases) {
    const res = mockRes();
    await getAllPackages(makeReq(tc.query), res);
    const data = res.getResult();
    if (data.data && data.data.length === tc.expectedCount) {
      console.log(`[PASS] ${tc.name}`);
    } else {
      console.error(`[FAIL] ${tc.name}. Expected ${tc.expectedCount}, got ${data.data ? data.data.length : 'error'}`);
    }
  }

  await mongoose.disconnect();
  await mongod.stop();
}

runTests().catch(console.error);
