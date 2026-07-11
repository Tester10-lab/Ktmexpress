import { jest } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../server.js';
import User from '../models/User.js';
import Package from '../models/Package.js';

jest.setTimeout(30000);

let mongoServer;
let dispatcherToken, riderToken;
let dispatcherId, riderId, vendorId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(mongoUri);

  // Setup Users
  const dispatcher = await User.create({ name: 'Dispatcher', email: 'd@test.com', password: 'password123', role: 'dispatcher' });
  const rider = await User.create({ name: 'Rider', email: 'r@test.com', password: 'password123', role: 'rider' });
  const vendor = await User.create({ name: 'Vendor', email: 'v@test.com', password: 'password123', role: 'vendor' });

  dispatcherId = dispatcher._id;
  riderId = rider._id;
  vendorId = vendor._id;

  const getLoginToken = async (email) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    return res.body.token;
  };

  dispatcherToken = await getLoginToken('d@test.com');
  riderToken = await getLoginToken('r@test.com');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Package.deleteMany({});
});

const createPkg = async (status, assignedToRider = true) => {
  return await Package.create({
    trackingCode: 'TRACK' + Date.now() + Math.floor(Math.random() * 1000),
    invoiceId: 'INV-TEST',
    vendorId,
    riderId: assignedToRider ? riderId : null,
    customerName: 'Test',
    customerPhone: '9800000000',
    address: 'Kathmandu',
    amount: 1000,
    status
  });
};

describe('Dispatcher assignRiderForDelivery State Guard', () => {
  it('rejects assigning a Delivered package', async () => {
    const pkg = await createPkg('Delivered', false);
    
    const res = await request(app)
      .put('/api/dispatcher/assign-delivery')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({ packageId: pkg._id.toString(), riderId: riderId.toString() });
      
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Cannot transition to Out for Delivery from "Delivered"/);
  });

  it('allows assigning an In Warehouse package', async () => {
    const pkg = await createPkg('In Warehouse', false);
    
    const res = await request(app)
      .put('/api/dispatcher/assign-delivery')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({ packageId: pkg._id.toString(), riderId: riderId.toString() });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.status).toEqual('Out for Delivery');
  });
});

describe('Rider updateDeliveryStatus State Guard', () => {
  it('rejects deliver on a Pending package', async () => {
    const pkg = await createPkg('Pending', true);
    
    const res = await request(app)
      .put('/api/rider/update-status')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ packageId: pkg._id.toString(), action: 'deliver' });
      
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Cannot transition to Delivered from "Pending"/);
  });

  it('rejects cancel on a Delivered package (COD Fraud Vector)', async () => {
    const pkg = await createPkg('Delivered', true);
    // Explicitly simulate an already delivered package holding money
    pkg.cashReconciled = true;
    await pkg.save();
    
    const res = await request(app)
      .put('/api/rider/update-status')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ packageId: pkg._id.toString(), action: 'cancel' });
      
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Cannot transition to Cancelled from "Delivered"/);
  });

  it('allows cancel on an Out for Delivery package', async () => {
    const pkg = await createPkg('Out for Delivery', true);
    
    const res = await request(app)
      .put('/api/rider/update-status')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ packageId: pkg._id.toString(), action: 'cancel', comment: 'Customer refused' });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.status).toEqual('Cancelled');
  });

  it('allows deliver on an Out for Delivery package', async () => {
    const pkg = await createPkg('Out for Delivery', true);
    
    const res = await request(app)
      .put('/api/rider/update-status')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ packageId: pkg._id.toString(), action: 'deliver', cashCollected: 1000 });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.status).toEqual('Delivered');
  });
});
