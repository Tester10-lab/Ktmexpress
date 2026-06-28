import { jest } from '@jest/globals';
import { login } from '../../controllers/authController.js';
import User from '../../models/User.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

jest.setTimeout(30000);

let mongoServer;

describe('authController - login unit', () => {
  let req, res, next;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);
    process.env.JWT_SECRET = 'testsecret';
    
    await User.create({
      name: 'Test Vendor',
      email: 'test@example.com',
      password: 'password123',
      role: 'vendor',
      status: 'Active'
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 401 if email or password missing', async () => {
    req.body.email = '';
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email and password are required.' });
  });

  it('should return 401 if user not found', async () => {
    req.body.email = 'wrong@example.com';
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials.' });
  });

  it('should return 401 if password does not match', async () => {
    req.body.password = 'wrongpass';
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid credentials.' });
  });

  it('should return 200 and token if credentials are valid', async () => {
    await login(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      user: expect.objectContaining({
        email: 'test@example.com',
        role: 'vendor'
      })
    }));
  });
});
