import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Package from '../../models/Package.js';
import User from '../../models/User.js';
import request from 'supertest';
import { app } from '../../server.js';
import jwt from 'jsonwebtoken';

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

  // Setup admin and vendor
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
    status: 'Active'
  });
  
  const vendor = await User.create({
    name: 'Vendor User',
    email: 'vendor@example.com',
    password: 'password',
    role: 'vendor',
    status: 'Active'
  });

  vendorId = vendor._id;
  adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Package.deleteMany({});
});

describe('Timeline Integrity Regression Test', () => {
  it('should append exactly 1 timeline event per package edit and never overwrite', async () => {
    // 1. Create package
    const createRes = await request(app)
      .post('/api/admin/packages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vendorId: vendorId.toString(),
        customerName: 'Test Customer',
        customerPhone: '9800000000',
        address: 'Kathmandu',
        amount: 1000,
        weight: 1
      });
      
    expect(createRes.status).toBe(201);
    const pkgId = createRes.body.data._id;
    
    // 2. Edit package 10 times consecutively
    for (let i = 1; i <= 10; i++) {
      const editRes = await request(app)
        .put(`/api/admin/packages/${pkgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1000 + i,
          reason: `Edit ${i}`
        });
      expect(editRes.status).toBe(200);
    }
    
    // 3. Verify in DB
    const finalPkg = await Package.findById(pkgId);
    
    // 1 creation + 10 edits
    expect(finalPkg.timeline.length).toBe(11);
    
    // Verify chronological order and no overwriting
    expect(finalPkg.timeline[0].message).toBe('Package arrived at warehouse.');
    
    for (let i = 1; i <= 10; i++) {
      const entry = finalPkg.timeline[i];
      expect(entry.message).toContain(`Package details updated by admin. Reason: Edit ${i}`);
      expect(entry.changes.length).toBeGreaterThan(0);
      expect(entry.changes[0].field).toBe('Amount');
      expect(entry.changes[0].after).toBe(1000 + i);
    }
  });
});
