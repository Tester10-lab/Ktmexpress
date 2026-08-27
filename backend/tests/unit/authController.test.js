import { jest } from '@jest/globals';
import { login, changePassword } from '../../controllers/authController.js';
import User from '../../models/User.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

jest.setTimeout(30000);

let mongoServer;
let testUser;

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
    
    testUser = await User.create({
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
      },
      headers: {},
      user: { id: testUser._id }
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

  describe('changePassword', () => {
    it('should reject if current or new password missing', async () => {
      req.body = { currentPassword: '', newPassword: '' };
      await changePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject if new password < 6 chars', async () => {
      req.body = { currentPassword: 'password123', newPassword: '123' };
      await changePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject if current password is wrong', async () => {
      req.body = { currentPassword: 'wrongpassword', newPassword: 'newpassword123' };
      await changePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should successfully update password with valid credentials', async () => {
      req.body = { currentPassword: 'password123', newPassword: 'newpassword123' };
      await changePassword(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Password changed successfully.'
      }));

      // Verify new password works
      const u = await User.findById(testUser._id).select('+password');
      const isMatch = await u.comparePassword('newpassword123');
      expect(isMatch).toBe(true);
    });
  });
});
