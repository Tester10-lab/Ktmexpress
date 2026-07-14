import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import Package from '../../models/Package.js';
import User from '../../models/User.js';
import { createPackageForVendor, bulkCreatePackagesForVendor } from '../../controllers/adminController.js';
import { createPackage } from '../../controllers/vendorController.js';
import { processCsvImport } from '../../utils/csvHelper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

jest.setTimeout(30000);
describe('Verification of Package Creation Workflows', () => {
  let mongoServer;
  let admin, vendor, rider;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    admin = await User.create({ name: 'Admin Test', email: 'admin_test3@test.com', password: 'password123', role: 'admin' });
    vendor = await User.create({ name: 'Vendor Test', email: 'vendor_test3@test.com', password: 'password123', role: 'vendor' });
    rider = await User.create({ name: 'Rider Test', email: 'rider_test3@test.com', password: 'password123', role: 'rider' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const mockRes = () => {
    const res = {};
    res.status = () => res;
    res.json = (data) => { res.data = data; return res; };
    return res;
  };

  it('Admin Create Order sets status to In Warehouse', async () => {
    const req = { user: admin, body: { vendorId: vendor._id.toString(), customerName: 'TestUserA', customerPhone: '1', address: '1', amount: 100 } };
    const res = mockRes();
    await createPackageForVendor(req, res);
    const pkg = res.data.data;
    expect(pkg.status).toBe('In Warehouse');
    expect(pkg.timeline[0].message).toBe('Package arrived at warehouse.');
  });

  it('Admin Bulk JSON sets status to In Warehouse', async () => {
    const req = { user: admin, body: { vendorId: vendor._id.toString(), packages: [{ customerName: 'TestUserB', customerPhone: '2', address: '2', amount: 200 }] } };
    const res = mockRes();
    await bulkCreatePackagesForVendor(req, res);
    const pkg = res.data.data[0];
    expect(pkg.status).toBe('In Warehouse');
    expect(pkg.timeline[0].message).toBe('Package arrived at warehouse.');
  });

  it('Vendor Create Order sets status to In Warehouse', async () => {
    const req = { user: vendor, body: { customerName: 'TestUserC', customerPhone: '3', address: '3', amount: 300 } };
    const res = mockRes();
    await createPackage(req, res);
    const pkg = res.data.data;
    expect(pkg.status).toBe('In Warehouse');
    expect(pkg.timeline[0].message).toBe('Package arrived at warehouse.');
  });

  it('Vendor Bulk Upload (CSV) sets status to In Warehouse', async () => {
    const csvContent = `customerName,customerPhone,address,amount\nTestUserD,4,4,400`;
    const csvPath = path.join(__dirname, 'test.csv');
    fs.writeFileSync(csvPath, csvContent);
    const result = await processCsvImport(csvPath, vendor._id.toString(), 'CSV Tester');
    const pkg = await Package.findById(result.data[0]);
    expect(pkg.status).toBe('In Warehouse');
    expect(pkg.timeline[0].message).toBe('Package arrived at warehouse.');
    fs.unlinkSync(csvPath);
  });

  it('Package only appears in Rider Dashboard when Out for Delivery', async () => {
    const pkg = await Package.create({
      trackingCode: 'TRACKING_TEST',
      invoiceId: 'INV_TEST',
      customerName: 'TestUserE',
      customerPhone: '5',
      address: '5',
      amount: 500,
      vendorId: vendor._id,
      status: 'Sorted', // Before out for delivery
      timeline: [{ time: new Date().toISOString(), status: 'Sorted', message: 'test', user: 'test' }]
    });

    const riderQuery = {
      $or: [
        { riderId: rider._id, status: { $in: ['Out for Delivery', 'Postponed'] } },
        { riderId: rider._id, status: { $in: ['Delivered', 'Cancelled', 'Returned', 'Exchanged'] }, deliveryVerificationStatus: { $in: ['Pending', 'Reopened'] } }
      ]
    };
    
    // Assign to rider but keep as Sorted
    await Package.findByIdAndUpdate(pkg._id, { riderId: rider._id });
    
    let riderPkgs = await Package.find(riderQuery);
    let found = riderPkgs.some(p => p._id.toString() === pkg._id.toString());
    expect(found).toBe(false); // Should not be found when Sorted

    // Change to Out for Delivery
    await Package.findByIdAndUpdate(pkg._id, { status: 'Out for Delivery' });
    riderPkgs = await Package.find(riderQuery);
    found = riderPkgs.some(p => p._id.toString() === pkg._id.toString());
    expect(found).toBe(true); // Should be found when Out for Delivery
  });
});
