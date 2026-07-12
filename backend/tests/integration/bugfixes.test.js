import request from 'supertest';
import { jest } from '@jest/globals';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

import publicRoutes from '../../routes/publicRoutes.js';
import dispatcherRoutes from '../../routes/dispatcherRoutes.js';
import User from '../../models/User.js';
import Package from '../../models/Package.js';

let mongoServer;
let app;
let dispatcherToken;
let riderId;
let postponedPackageId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/public', publicRoutes);
  
  // Use a simple mock auth for dispatcher routes
  app.use('/api/dispatcher', (req, res, next) => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    next();
  }, dispatcherRoutes);

  // Setup mock data
  const dispatcher = await User.create({
    name: 'Test Dispatcher',
    email: 'dispatcher@test.com',
    password: 'password123',
    role: 'dispatcher',
    status: 'Active'
  });

  const rider = await User.create({
    name: 'Test Rider',
    email: 'rider@test.com',
    password: 'password123',
    role: 'rider',
    status: 'Active'
  });
  riderId = rider._id;

  dispatcherToken = jwt.sign({ id: dispatcher._id, role: 'dispatcher' }, process.env.JWT_SECRET);

  const pkg = await Package.create({
    trackingCode: 'KDMTESTPOSTPONED',
    vendorId: dispatcher._id, // Just for mock
    customerName: 'Test Customer',
    customerPhone: '9876543210',
    invoiceId: 'INV-001',
    address: 'Test Addr',
    city: 'Kathmandu',
    amount: 1000,
    status: 'Postponed'
  });
  postponedPackageId = pkg._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Verification of Bug Fixes', () => {
  it('Tracking ID returns real package data through the exact API configuration', async () => {
    const res = await request(app).get('/api/public/track/KDMTESTPOSTPONED');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trackingCode).toBe('KDMTESTPOSTPONED');
    expect(res.body.data.status).toBe('Postponed');
  });

  it('A real Postponed package is reassigned through the dispatcher API and becomes Out for Delivery', async () => {
    // Attempt bulk assign of a Postponed package
    const res = await request(app)
      .put('/api/dispatcher/bulk-assign')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .send({
        packageIds: [postponedPackageId],
        riderId: riderId
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify it updated the DB
    const updatedPkg = await Package.findById(postponedPackageId);
    expect(updatedPkg.status).toBe('Out for Delivery');
    expect(updatedPkg.riderId.toString()).toBe(riderId.toString());
  });
});
