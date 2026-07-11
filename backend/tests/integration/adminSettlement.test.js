import { jest } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../../server.js';
import User from '../../models/User.js';
import Package from '../../models/Package.js';

jest.setTimeout(30000);

let mongoServer;
let adminToken;
let vendorId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(mongoUri);

  const admin = await User.create({ name: 'Admin', email: 'a@test.com', password: 'password123', role: 'admin' });
  const vendor = await User.create({ name: 'Vendor', email: 'v@test.com', password: 'password123', role: 'vendor' });

  vendorId = vendor._id;

  const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'password123' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Package.deleteMany({});
});

describe('Admin Settlement Endpoints Enum Fix Validation', () => {
  it('successfully verifies COD without ValidationError', async () => {
    const pkg = await Package.create({
      trackingCode: 'TRACK' + Date.now(),
      invoiceId: 'INV1',
      address: 'KTM',
      customerName: 'Cust',
      customerPhone: '9800',
      vendorId,
      amount: 1000,
      status: 'Delivered',
      deliveryCharge: 100,
      vendorReceivable: 900
    });

    const res = await request(app)
      .post(`/api/admin/settlements/verify-cod/${pkg._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);

    const updatedPkg = await Package.findById(pkg._id);
    expect(updatedPkg.settlementStatus).toEqual('Verified');
    expect(updatedPkg.codVerified).toBe(true);
  });

  it('successfully marks vendor paid without ValidationError', async () => {
    const pkg = await Package.create({
      trackingCode: 'TRACK' + Date.now(),
      invoiceId: 'INV2',
      address: 'KTM',
      customerName: 'Cust',
      customerPhone: '9800',
      vendorId,
      amount: 1000,
      status: 'Delivered',
      deliveryCharge: 100,
      vendorReceivable: 900
    });

    const res = await request(app)
      .post('/api/admin/settlements/mark-paid')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ packageIds: [pkg._id.toString()], paymentMethod: 'Bank' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);

    const updatedPkg = await Package.findById(pkg._id);
    expect(updatedPkg.settlementStatus).toEqual('Settled');
    expect(updatedPkg.vendorPaid).toBe(true);
  });
});
