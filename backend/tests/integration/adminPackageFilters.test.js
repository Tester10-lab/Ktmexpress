import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Package from '../../models/Package.js';
import User from '../../models/User.js';
import { getAllPackagesAdmin } from '../../controllers/adminController.js';

jest.setTimeout(30000);
describe('Admin Package Filters - Date Range & Combined Logic', () => {
  let mongoServer;
  let admin, vendor1, rider1;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'admin' });
    vendor1 = await User.create({ name: 'Vendor1', email: 'v1@test.com', password: 'password123', role: 'vendor' });
    rider1 = await User.create({ name: 'Rider1', email: 'r1@test.com', password: 'password123', role: 'rider' });

    // Seed packages
    await Package.create([
      {
        trackingCode: 'OUTSIDE_BEFORE',
        customerName: 'CustA',
        customerPhone: '111',
        address: 'AddA',
        invoiceId: 'INV1',
        amount: 100,
        vendorId: vendor1._id,
        riderId: rider1._id,
        createdAt: new Date('2025-01-01T10:00:00Z'), // well before range
      },
      {
        trackingCode: 'INSIDE_1',
        customerName: 'CustB',
        customerPhone: '222',
        address: 'AddB',
        invoiceId: 'INV2',
        amount: 200,
        vendorId: vendor1._id,
        riderId: rider1._id,
        createdAt: new Date('2025-01-10T05:00:00Z'), // inside range
      },
      {
        trackingCode: 'INSIDE_2',
        customerName: 'CustC',
        customerPhone: '333',
        address: 'AddC',
        invoiceId: 'INV3',
        amount: 300,
        vendorId: vendor1._id,
        createdAt: new Date('2025-01-15T10:00:00Z'), // safely inside range
      },
      {
        trackingCode: 'OUTSIDE_AFTER',
        customerName: 'CustD',
        customerPhone: '444',
        address: 'AddD',
        invoiceId: 'INV4',
        amount: 400,
        vendorId: vendor1._id,
        createdAt: new Date('2025-01-20T10:00:00Z'), // after range
      }
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const mockReq = (query) => ({ user: admin, query });
  const mockRes = () => {
    const res = {};
    res.status = () => res;
    res.json = (data) => { res.data = data; return res; };
    return res;
  };

  it('filters correctly by startDate and endDate (including the entire end day)', async () => {
    const req = mockReq({ startDate: '2025-01-10', endDate: '2025-01-15' });
    const res = mockRes();
    
    await getAllPackagesAdmin(req, res);
    
    expect(res.data.success).toBe(true);
    expect(res.data.data.length).toBe(2);
    
    const trackingCodes = res.data.data.map(p => p.trackingCode).sort();
    expect(trackingCodes).toEqual(['INSIDE_1', 'INSIDE_2']);
  });

  it('combines date filter with AND logic for other fields (e.g. rider)', async () => {
    // Only INSIDE_1 has rider1 assigned
    const req = mockReq({ startDate: '2025-01-10', endDate: '2025-01-15', rider: rider1._id.toString() });
    const res = mockRes();
    
    await getAllPackagesAdmin(req, res);
    
    expect(res.data.success).toBe(true);
    expect(res.data.data.length).toBe(1);
    expect(res.data.data[0].trackingCode).toBe('INSIDE_1');
  });

  it('combines search logic properly using $and instead of overwriting', async () => {
    // 'Cust' matches all, but we only want the date range and tracking code 'INSIDE_1'
    const req = mockReq({ startDate: '2025-01-10', endDate: '2025-01-15', search: 'INSIDE_1', customer: 'Cust' });
    const res = mockRes();
    
    await getAllPackagesAdmin(req, res);
    
    expect(res.data.success).toBe(true);
    expect(res.data.data.length).toBe(1);
    expect(res.data.data[0].trackingCode).toBe('INSIDE_1');
  });
});
