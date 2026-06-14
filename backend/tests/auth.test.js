import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../server.js';
import User from '../models/User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined(); // Refresh token
  });

  it('should lock account after 5 failed login attempts', async () => {
    await User.create({
      name: 'User',
      email: 'user@test.com',
      password: 'password123',
      role: 'vendor'
    });

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' });
    }

    const lockedRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' }); // Correct pass but locked

    expect(lockedRes.statusCode).toEqual(429);
    expect(lockedRes.body.message).toMatch(/Account temporarily locked/);
  });
});
