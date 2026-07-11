import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

jest.setTimeout(30000);

let mongoServer;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);

  // Setup Admin user
  const adminUser = await User.create({
    name: 'Admin Test',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    contact: '9800000000',
    status: 'Active'
  });

  adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Pricing Engine Routes', () => {
  
  describe('GET /api/admin/pricing-engine/summary', () => {
    it('should return pricing engine summary for admin', async () => {
      const res = await request(app)
        .get('/api/admin/pricing-engine/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('globalSettings');
      expect(res.body.data).toHaveProperty('totalOvCities');
    });

    it('should block unauthenticated access', async () => {
      const res = await request(app).get('/api/admin/pricing-engine/summary');
      expect(res.status).toBe(401);
    });
  });

});
