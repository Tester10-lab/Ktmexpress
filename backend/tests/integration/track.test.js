import request from 'supertest';
import { app } from '../../server.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Package from '../../models/Package.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Package.deleteMany({});
});

test('track package public endpoint', async () => {
  await Package.create({
    trackingCode: 'LOG-TEST1',
    invoiceId: 'INV-TEST',
    customerName: 'Test User',
    customerPhone: '9800000000',
    address: 'Test Address',
    amount: 1000,
    status: 'Pending'
  });

  const res = await request(app).get('/api/public/track/LOG-TEST1');
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data.trackingCode).toBe('LOG-TEST1');
});
