import { jest } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../../server.js';
import User from '../../models/User.js';
import Package from '../../models/Package.js';
import Settlement from '../../models/Settlement.js';

jest.setTimeout(30000);

let mongoServer;
let vendorToken;
let vendorId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(process.env.MONGO_URI);

  const vendor = await User.create({ name: 'Vendor', email: 'v2@test.com', password: 'password123', role: 'vendor' });
  vendorId = vendor._id;

  const res = await request(app).post('/api/auth/login').send({ email: 'v2@test.com', password: 'password123' });
  vendorToken = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('rolls back isSettling lock if Settlement.create fails', async () => {
  const pkg = await Package.create({
    trackingCode: 'TESTLOCK1',
    vendorId,
    amount: 1000,
    deliveryCharge: 100,
    status: 'Delivered',
    cashReconciled: true,
    vendorPaid: false,
    isSettling: false,
    address: 'Test Address',
    customerPhone: '1234567890',
    customerName: 'Test Customer',
    invoiceId: 'INV123'
  });

  // Mock Settlement.create to throw an error
  jest.spyOn(Settlement, 'create').mockRejectedValueOnce(new Error('Mock Settlement Error'));

  const res = await request(app)
    .post('/api/vendor/settlements')
    .set('Authorization', `Bearer ${vendorToken}`)
    .send();

  expect(res.statusCode).toBe(500);
  expect(res.body.message).toBe('Mock Settlement Error');

  const updatedPkg = await Package.findById(pkg._id);
  expect(updatedPkg.isSettling).toBe(false); // Lock should be released
});
