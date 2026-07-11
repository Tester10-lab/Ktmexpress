import { jest } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../server.js';
import User from '../models/User.js';
import Package from '../models/Package.js';

jest.setTimeout(30000);

let mongoServer;
let adminToken, dispatcherToken, vendor1Token, vendor2Token;
let adminId, dispatcherId, vendor1Id, vendor2Id;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(mongoUri);

  // Setup Users
  const admin = await User.create({ name: 'Admin', email: 'a@test.com', password: 'password123', role: 'admin' });
  const dispatcher = await User.create({ name: 'Dispatcher', email: 'd@test.com', password: 'password123', role: 'dispatcher' });
  const vendor1 = await User.create({ name: 'Vendor1', email: 'v1@test.com', password: 'password123', role: 'vendor' });
  const vendor2 = await User.create({ name: 'Vendor2', email: 'v2@test.com', password: 'password123', role: 'vendor' });

  adminId = admin._id;
  dispatcherId = dispatcher._id;
  vendor1Id = vendor1._id;
  vendor2Id = vendor2._id;

  const getLoginToken = async (email) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    return res.body.token;
  };

  adminToken = await getLoginToken('a@test.com');
  dispatcherToken = await getLoginToken('d@test.com');
  vendor1Token = await getLoginToken('v1@test.com');
  vendor2Token = await getLoginToken('v2@test.com');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Package.deleteMany({});
});

describe('QR Scanner API', () => {

  const createPkg = async (vendorId, trackingCode, status = 'Pending') => {
    return await Package.create({
      trackingCode,
      invoiceId: 'INV-TEST',
      customerName: 'Test',
      customerPhone: '9800000000',
      address: 'Test Address',
      amount: 1000,
      vendorId,
      status
    });
  };

  describe('GET /api/packages/track/:trackingCode', () => {
    
    it('returns 400 for malformed tracking code', async () => {
      const res = await request(app).get('/api/packages/track/123').set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Invalid tracking code/);
    });

    it('allows vendor to track their own package', async () => {
      await createPkg(vendor1Id, 'ABCDEFG');
      const res = await request(app).get('/api/packages/track/ABCDEFG').set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.trackingCode).toEqual('ABCDEFG');
    });

    it('prevents vendor from tracking another vendor package', async () => {
      await createPkg(vendor2Id, 'HIJKLMN');
      const res = await request(app).get('/api/packages/track/HIJKLMN').set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.statusCode).toEqual(404);
    });

    it('allows admin/dispatcher to track any vendor package', async () => {
      await createPkg(vendor1Id, 'OPQRSTU');
      const res = await request(app).get('/api/packages/track/OPQRSTU').set('Authorization', `Bearer ${dispatcherToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.trackingCode).toEqual('OPQRSTU');
      
      const resAdmin = await request(app).get('/api/packages/track/OPQRSTU').set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.statusCode).toEqual(200);
    });
  });

  describe('PATCH /api/packages/:trackingCode/warehouse-arrival', () => {

    it('enforces role guard: vendor cannot confirm arrival', async () => {
      await createPkg(vendor1Id, 'ABCDEFG');
      const res = await request(app).patch('/api/packages/ABCDEFG/warehouse-arrival').set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.statusCode).toEqual(403);
    });

    it('rejects invalid predecessor status (e.g. Delivered)', async () => {
      await createPkg(vendor1Id, 'ABCDEFG', 'Delivered');
      const res = await request(app).patch('/api/packages/ABCDEFG/warehouse-arrival').set('Authorization', `Bearer ${dispatcherToken}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Cannot transition/);
    });

    it('allows valid predecessor transition (e.g. Picked Up) and appends to timeline', async () => {
      await createPkg(vendor1Id, 'ABCDEFG', 'Picked Up');
      const res = await request(app).patch('/api/packages/ABCDEFG/warehouse-arrival').set('Authorization', `Bearer ${dispatcherToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('In Warehouse');
      
      const lastTimeline = res.body.data.timeline[res.body.data.timeline.length - 1];
      expect(lastTimeline.status).toEqual('In Warehouse');
      expect(lastTimeline.role).toEqual('dispatcher');
    });

    it('returns idempotent success if already In Warehouse', async () => {
      const pkg = await createPkg(vendor1Id, 'ABCDEFG', 'In Warehouse');
      pkg.timeline.push({ time: new Date().toISOString(), status: 'In Warehouse', user: 'Dispatcher' });
      await pkg.save();

      const res = await request(app).patch('/api/packages/ABCDEFG/warehouse-arrival').set('Authorization', `Bearer ${dispatcherToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toMatch(/Already confirmed by/);
    });

  });

  describe('PUT /api/dispatcher/confirm-warehouse', () => {
    it('rejects exploit attempt to move Delivered package back to In Warehouse', async () => {
      const pkg = await createPkg(vendor1Id, 'EXPLOIT', 'Delivered');
      
      const res = await request(app)
        .put('/api/dispatcher/confirm-warehouse')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({ packageId: pkg._id.toString() });
        
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Cannot transition to In Warehouse from "Delivered"/);
    });

    it('allows valid predecessor transition (e.g. Picked Up) to In Warehouse', async () => {
      const pkg = await createPkg(vendor1Id, 'VALID', 'Picked Up');
      
      const res = await request(app)
        .put('/api/dispatcher/confirm-warehouse')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({ packageId: pkg._id.toString() });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('In Warehouse');
    });
  });
});
