import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from './models/User.js';
import Package from './models/Package.js';
import { createPackageForVendor, getAllPackagesAdmin } from './controllers/adminController.js';
import bcrypt from 'bcryptjs';

let mongoServer;

async function runTest() {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to Memory DB');

    const admin = await User.create({
      name: 'Admin', email: 'admin@ktm.com', password: 'password123', role: 'admin', phone: '1111111111'
    });
    
    const vendor = await User.create({
      name: 'Vendor', email: 'vendor@ktm.com', password: 'password123', role: 'vendor', phone: '2222222222',
      vendorMeta: { shopName: 'Trendy Shop' }
    });

    console.log('--- 1. Creating package via controller ---');
    let createResData = null;
    const reqCreate = {
      user: admin,
      body: {
        vendorId: vendor._id.toString(),
        customerName: 'Test Customer',
        customerPhone: '9841000000',
        address: 'Test Address',
        city: 'Kathmandu',
        amount: 1000,
        weight: 1
      }
    };
    const resCreate = {
      status: function(code) { return this; },
      json: function(data) { createResData = data; }
    };
    await createPackageForVendor(reqCreate, resCreate);
    console.log('Created Tracking Code:', createResData.data.trackingCode);

    console.log('\n--- 2. MongoDB Document ---');
    const dbDoc = await Package.findById(createResData.data._id).lean();
    console.log(JSON.stringify(dbDoc, null, 2));

    console.log('\n--- 3. API Response Page 1 ---');
    let page1Data = null;
    const reqPage1 = { query: { page: '1', limit: '10' } };
    const resPage1 = {
      status: function(c) { return this; },
      json: function(d) { page1Data = d; }
    };
    await getAllPackagesAdmin(reqPage1, resPage1);
    console.log(`Total packages: ${page1Data.pagination.total}`);
    console.log(`Package on Page 1? ${page1Data.data.some(p => p.trackingCode === createResData.data.trackingCode)}`);
    console.log(JSON.stringify(page1Data.data[0], null, 2));

    console.log('\n--- 4. API Response Page 2 ---');
    let page2Data = null;
    const reqPage2 = { query: { page: '2', limit: '10' } };
    const resPage2 = {
      status: function(c) { return this; },
      json: function(d) { page2Data = d; }
    };
    await getAllPackagesAdmin(reqPage2, resPage2);
    console.log(`Total packages: ${page2Data.pagination.total}`);
    console.log(`Package on Page 2? ${page2Data.data.some(p => p.trackingCode === createResData.data.trackingCode)}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }
}

runTest();
