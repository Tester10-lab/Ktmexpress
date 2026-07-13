import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Adjust path for models depending on where script is run
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../../models/User.js';
import Package from '../../models/Package.js';
import Settlement from '../../models/Settlement.js';

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for QA Seeding');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const runSeed = async () => {
  await connectDB();
  console.log('Starting QA Swarm Database Seed...');

  const hash = await bcrypt.hash('password123', 10);

  console.log('Clearing old QA data...');
  await User.deleteMany({ email: /qa_/ });
  await Package.deleteMany({ trackingCode: /QA-TRK/ });
  await Settlement.deleteMany({ reference: /QA-SETTLE/ });
  
  console.log('Generating 1 Super Admin...');
  await User.insertMany([{
    name: 'QA Super Admin',
    email: 'qa_admin@ruflo.com',
    password: hash,
    role: 'admin',
    contact: '0000000001',
  }]);

  console.log('Generating 5 Dispatchers...');
  const dispatchers = await User.insertMany(
    Array.from({ length: 5 }).map((_, i) => ({
      name: `QA Dispatcher ${i + 1}`,
      email: `qa_dispatcher${i + 1}@ruflo.com`,
      password: hash,
      role: 'dispatcher',
      contact: `000000010${i}`
    }))
  );

  console.log('Generating 50 Vendors...');
  const vendors = await User.insertMany(
    Array.from({ length: 50 }).map((_, i) => ({
      name: `QA Vendor ${i + 1}`,
      email: `qa_vendor${i + 1}@ruflo.com`,
      password: hash,
      role: 'vendor',
      contact: `000000020${i}`,
      vendorMeta: {
        useGlobalPricing: Math.random() > 0.5,
        customFlatRate: Math.random() > 0.8 ? Math.floor(Math.random() * 50) + 100 : null
      }
    }))
  );

  console.log('Generating 200 Riders...');
  const riders = await User.insertMany(
    Array.from({ length: 200 }).map((_, i) => ({
      name: `QA Rider ${i + 1}`,
      email: `qa_rider${i + 1}@ruflo.com`,
      password: hash,
      role: 'rider',
      contact: `000000030${i}`
    }))
  );

  console.log('Generating 1000 Mock Customer Profiles (for Package data)...');
  const customers = Array.from({ length: 1000 }).map((_, i) => ({
    name: `QA Customer ${i + 1}`,
    contact: `000000040${i}`
  }));

  console.log('Generating 1000 Orders (Packages)...');
  const packageStatuses = ['Pending', 'Pick Up Requested', 'Picked Up', 'In Warehouse', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
  const packagesData = [];
  
  for (let i = 0; i < 1000; i++) {
    const v = vendors[Math.floor(Math.random() * vendors.length)];
    const r = Math.random() > 0.3 ? riders[Math.floor(Math.random() * riders.length)] : null;
    const c = customers[Math.floor(Math.random() * customers.length)];
    const status = packageStatuses[Math.floor(Math.random() * packageStatuses.length)];
    
    const amount = Math.random() > 0.1 ? Math.floor(Math.random() * 5000) : 0; 
    const deliveryCharge = Math.random() > 0.1 ? 100 + Math.floor(Math.random() * 50) : 0; 
    const isCashReconciled = status === 'Delivered' && Math.random() > 0.2;
    const isVendorPaid = isCashReconciled && Math.random() > 0.5;

    packagesData.push({
      trackingCode: `QA-TRK-${Date.now()}-${i}`,
      invoiceId: `QA-INV-${Date.now()}-${i}`,
      customerName: c.name,
      customerPhone: c.contact,
      address: 'QA Location ' + i,
      city: Math.random() > 0.5 ? 'KTM' : 'PKR',
      outOfValley: Math.random() > 0.7,
      weight: Math.max(0.1, (Math.random() * 5)).toFixed(2),
      packageAccess: 'sealed',
      items: [],
      amount: amount,
      deliveryCharge: deliveryCharge,
      vendorId: v._id,
      riderId: status !== 'Pending' && status !== 'Pick Up Requested' ? (r ? r._id : undefined) : undefined,
      status: status,
      cashReconciled: isCashReconciled,
      vendorPaid: isVendorPaid,
      timeline: [{
        time: new Date().toISOString(),
        status: 'In Warehouse',
        message: 'Package arrived at warehouse.',
        user: 'System'
      }]
    });
  }

  const batchSize = 500;
  for (let i = 0; i < packagesData.length; i += batchSize) {
    const batch = packagesData.slice(i, i + batchSize);
    await Package.insertMany(batch);
    console.log(`Inserted ${i + batch.length} / 1000 packages...`);
  }

  console.log('Generating Settlements...');
  const delivered = await Package.find({ status: 'Delivered', vendorPaid: true }).limit(500);
  
  const settlementData = [];
  for (let i = 0; i < 50; i++) {
    const v = vendors[i];
    const vendorPkgs = delivered.filter(p => p.vendorId.toString() === v._id.toString()).slice(0, 5);
    if (vendorPkgs.length > 0) {
      settlementData.push({
        vendorId: v._id,
        requestedAmount: vendorPkgs.reduce((acc, p) => acc + (p.amount - p.deliveryCharge), 0),
        status: Math.random() > 0.5 ? 'Approved' : (Math.random() > 0.5 ? 'Pending' : 'Rejected'),
        packageIds: vendorPkgs.map(p => p._id),
        paidAt: new Date(),
        reference: `QA-SETTLE-${i}`
      });
    }
  }
  await Settlement.insertMany(settlementData);

  console.log('✅ QA Seed Data Generation Complete!');
  process.exit(0);
};

runSeed();
