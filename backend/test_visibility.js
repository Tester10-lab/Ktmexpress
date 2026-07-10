import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import { createServer } from 'http';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import User from './models/User.js';
import Package from './models/Package.js';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

let mongoServer;

async function runTest() {
  try {
    // 1. Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to Memory DB');

    // 2. Seed Admin & Vendor
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);
    
    await User.create({
      name: 'Admin User',
      email: 'admin@ktmexpress.com',
      password,
      role: 'admin',
      phone: '1234567890'
    });
    
    const vendor = await User.create({
      name: 'Test Vendor',
      email: 'vendor@ktmexpress.com',
      password,
      role: 'vendor',
      phone: '0987654321',
      vendorMeta: { shopName: 'Trendy Collection', businessType: 'Retail' }
    });

    // 3. Start local express server
    const server = createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;
    const API_URL = `http://localhost:${port}/api`;
    console.log(`Server running at ${API_URL}`);

    // 4. Login as Admin
    console.log('Logging in as Admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ktmexpress.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    const token = loginData.token;

    // 5. Create Package
    console.log('Creating package via API...');
    const createRes = await fetch(`${API_URL}/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        vendorId: vendor._id.toString(),
        customerName: 'Test Customer',
        customerPhone: '9841000000',
        address: 'Test Address',
        city: 'Kathmandu',
        amount: 1000,
        weight: 1
      })
    });
    const createData = await createRes.json();
    console.log('Create Package Response:', JSON.stringify(createData, null, 2));

    const trackingCode = createData.data.trackingCode;
    const pkgId = createData.data._id;

    // 6. Direct MongoDB Verification
    console.log('\n--- MONGODB DOCUMENT ---');
    const dbDoc = await Package.findById(pkgId).lean();
    console.log(JSON.stringify(dbDoc, null, 2));

    // 7. Get API Page 1
    console.log('\n--- API /admin/packages?page=1&limit=10 ---');
    const page1Res = await fetch(`${API_URL}/admin/packages?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const page1Data = await page1Res.json();
    console.log(JSON.stringify(page1Data, null, 2));

    // 8. Get API Page 2
    console.log('\n--- API /admin/packages?page=2&limit=10 ---');
    const page2Res = await fetch(`${API_URL}/admin/packages?page=2&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const page2Data = await page2Res.json();
    console.log(JSON.stringify(page2Data, null, 2));

    server.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1d';
runTest();
