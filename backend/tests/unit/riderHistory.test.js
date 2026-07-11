import { jest } from '@jest/globals';
import { getRiderHistory } from '../../controllers/dispatcherController.js';
import User from '../../models/User.js';
import Package from '../../models/Package.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

jest.setTimeout(30000);

let mongoServer;

describe('dispatcherController - getRiderHistory unit', () => {
  let req, res;
  let riderUser, vendorUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);
    
    // Create rider
    riderUser = await User.create({
      name: 'Rider Harry',
      email: 'harry@example.com',
      password: 'password123',
      role: 'rider',
      status: 'Active'
    });

    // Create vendor
    vendorUser = await User.create({
      name: 'Harry Vendor',
      email: 'vendorharry@example.com',
      password: 'password123',
      role: 'vendor',
      status: 'Active'
    });

    // Create package assigned to rider (current assignment)
    await Package.create({
      trackingCode: 'TRK-CURR-001',
      invoiceId: 'INV-001',
      customerName: 'Customer A',
      customerPhone: '9800000000',
      address: 'Kathmandu',
      amount: 1500,
      deliveryCharge: 150,
      status: 'Out for Delivery',
      riderId: riderUser._id,
      vendorId: vendorUser._id,
      outOfValley: false,
    });

    // Create package historical assignment (rider is no longer riderId but is in timeline.user)
    await Package.create({
      trackingCode: 'TRK-HIST-002',
      invoiceId: 'INV-002',
      customerName: 'Customer B',
      customerPhone: '9811111111',
      address: 'Lalitpur',
      amount: 2500,
      deliveryCharge: 150,
      status: 'Delivered',
      vendorId: vendorUser._id,
      outOfValley: false,
      timeline: [
        {
          time: '2026-07-10 10:00',
          status: 'Delivered',
          message: 'Delivery completed.',
          user: 'Rider Harry'
        }
      ]
    });

    // Create package outside valley (timeline message mentions rider)
    await Package.create({
      trackingCode: 'TRK-VAL-003',
      invoiceId: 'INV-003',
      customerName: 'Customer C',
      customerPhone: '9822222222',
      address: 'Pokhara',
      amount: 3500,
      deliveryCharge: 250,
      status: 'Postponed',
      vendorId: vendorUser._id,
      outOfValley: true,
      timeline: [
        {
          time: '2026-07-09 12:00',
          status: 'Sent to Delivery',
          message: 'Assigned to Rider Rider Harry for delivery route',
          user: 'Dispatcher A'
        }
      ]
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    req = {
      params: {
        id: riderUser._id.toString()
      },
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return 404 if rider not found', async () => {
    req.params.id = new mongoose.Types.ObjectId().toString();
    await getRiderHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Rider not found.'
    }));
  });

  it('should load all historical packages and return calculated KPIs', async () => {
    await getRiderHistory(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        rider: expect.objectContaining({
          name: 'Rider Harry',
          email: 'harry@example.com'
        }),
        stats: expect.objectContaining({
          totalHandled: 3,
          totalPickedUp: 3,
          totalDelivered: 1,
          totalCODCollected: 2500,
          currentAssigned: 1
        })
      })
    }));
  });

  it('should filter packages by status', async () => {
    req.query.status = 'Delivered';
    await getRiderHistory(req, res);
    const response = res.json.mock.calls[0][0];
    expect(response.data.packages).toHaveLength(1);
    expect(response.data.packages[0].trackingCode).toBe('TRK-HIST-002');
  });

  it('should filter packages by valley region', async () => {
    req.query.valley = 'outside';
    await getRiderHistory(req, res);
    const response = res.json.mock.calls[0][0];
    expect(response.data.packages).toHaveLength(1);
    expect(response.data.packages[0].trackingCode).toBe('TRK-VAL-003');
  });
});
