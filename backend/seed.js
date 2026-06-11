import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';
import Package from './models/Package.js';
import Allowance from './models/Allowance.js';

async function seed() {
  await connectDB();
  console.log('[SEED] Connected to MongoDB. Starting seed...');

  // Clear existing data
  await User.deleteMany({});
  await Package.deleteMany({});
  await Allowance.deleteMany({});
  console.log('[SEED] Cleared existing data.');

  // Create users
  const admin = await User.create({
    name: 'Super Administrator', email: 'admin@exdexpress.com', password: 'admin123',
    role: 'admin', contact: '+977-9801234567',
  });

  const bella = await User.create({
    name: 'Bella Cosmetics', email: 'bella@exdexpress.com', password: 'vendor123',
    role: 'vendor', contact: '+977-9851122334',
    vendorMeta: { shopName: 'Bella Cosmetics', defaultKtmRate: 120, defaultOutsideRate: 180, weightSurcharge: 40 },
  });

  const urban = await User.create({
    name: 'Urban Threads', email: 'urban@exdexpress.com', password: 'vendor123',
    role: 'vendor', contact: '+977-9841122334',
    vendorMeta: { shopName: 'Urban Threads', defaultKtmRate: 150, defaultOutsideRate: 220, weightSurcharge: 50 },
  });

  const dispatcher = await User.create({
    name: 'Central Hub Dispatcher', email: 'dispatcher@exdexpress.com', password: 'dispatch123',
    role: 'dispatcher', contact: '+977-9811223344',
  });

  const ram = await User.create({
    name: 'Ram Bahadur', email: 'ram@exdexpress.com', password: 'rider123',
    role: 'rider', contact: '+977-9808877665',
  });

  const shyam = await User.create({
    name: 'Shyam Thapa', email: 'shyam@exdexpress.com', password: 'rider123',
    role: 'rider', contact: '+977-9818877665',
  });

  console.log('[SEED] Users created.');

  // Create allowances for riders
  await Allowance.create({ riderId: ram._id, dailyAllowance: 500, weeklyAllowance: 3000, monthlyAllowance: 12000 });
  await Allowance.create({ riderId: shyam._id, dailyAllowance: 500, weeklyAllowance: 3000, monthlyAllowance: 12000 });

  // Create seed packages
  const pkg1 = await Package.create({
    trackingCode: 'LOG-2026-KTM01', invoiceId: 'INV-1001',
    customerName: 'Sita Sharma', customerPhone: '+977-9860112233',
    address: 'Koteshwor, Kathmandu', outOfValley: false, weight: 0.8, packageAccess: 'sealed',
    items: [{ productId: 'PROD-B01', name: 'Matte Liquid Lipstick (Red Crimson)', price: 1200, qty: 2 }],
    amount: 2550, deliveryCharge: 150, vendorId: bella._id, riderId: ram._id,
    status: 'Delivered', comments: 'Delivered to customer directly. Received cash.',
    cashReconciled: true,
    timeline: [
      { time: '2026-06-04 10:15', status: 'Invoice Created', message: 'Vendor created package invoice INV-1001', user: 'Bella Cosmetics' },
      { time: '2026-06-04 11:00', status: 'Pick Up Requested', message: 'Vendor requested courier pickup', user: 'Bella Cosmetics' },
      { time: '2026-06-04 11:30', status: 'Picked Up', message: 'Rider Ram Bahadur picked up package from vendor store', user: 'Rider Ram' },
      { time: '2026-06-04 12:15', status: 'Arrived in Warehouse', message: 'Inbound scanned at central hub', user: 'Dispatcher' },
      { time: '2026-06-04 13:00', status: 'Sent to Delivery', message: 'Assigned to Rider Ram Bahadur for delivery route', user: 'Dispatcher' },
      { time: '2026-06-04 14:30', status: 'Delivered', message: 'Delivery completed successfully. Collected Rs. 2550 COD.', user: 'Rider Ram' },
    ],
  });

  const pkg2 = await Package.create({
    trackingCode: 'LOG-2026-PKR02', invoiceId: 'INV-1002',
    customerName: 'Anil Gurung', customerPhone: '+977-9806112233',
    address: 'Lakeside, Pokhara', outOfValley: true, city: 'Pokhara', weight: 1.5, packageAccess: 'open',
    items: [{ productId: 'PROD-U01', name: 'Oversized Denim Jacket (L / Blue Wash)', price: 3200, qty: 1 }],
    amount: 3450, deliveryCharge: 250, vendorId: urban._id, riderId: shyam._id,
    status: 'Cancelled', comments: 'Customer refused due to minor sizing mismatch.',
    timeline: [
      { time: '2026-06-04 11:45', status: 'Invoice Created', message: 'Vendor created package invoice INV-1002', user: 'Urban Threads' },
      { time: '2026-06-04 12:30', status: 'Pick Up Requested', message: 'Vendor requested courier pickup', user: 'Urban Threads' },
      { time: '2026-06-04 13:15', status: 'Picked Up', message: 'Rider Shyam Thapa picked up package from vendor store', user: 'Rider Shyam' },
      { time: '2026-06-04 14:00', status: 'Arrived in Warehouse', message: 'Inbound scanned at central hub', user: 'Dispatcher' },
      { time: '2026-06-04 14:45', status: 'Sent to Delivery', message: 'Assigned to Rider Shyam Thapa for delivery route', user: 'Dispatcher' },
      { time: '2026-06-04 17:00', status: 'Cancelled', message: 'Delivery failed: Customer rejected package.', user: 'Rider Shyam' },
    ],
  });

  const pkg3 = await Package.create({
    trackingCode: 'LOG-2026-KTM03', invoiceId: 'INV-1003',
    customerName: 'Pooja Shrestha', customerPhone: '+977-9841998877',
    address: 'Jamsikhel, Lalitpur', outOfValley: false, weight: 0.3, packageAccess: 'sealed',
    items: [{ productId: 'PROD-B02', name: 'Velvet Rose Serum (30ml Glossy)', price: 1800, qty: 1 }],
    amount: 1950, deliveryCharge: 150, vendorId: bella._id, riderId: ram._id,
    status: 'Out for Delivery',
    timeline: [
      { time: '2026-06-05 09:30', status: 'Invoice Created', message: 'Vendor created package invoice INV-1003', user: 'Bella Cosmetics' },
      { time: '2026-06-05 10:00', status: 'Pick Up Requested', message: 'Vendor requested courier pickup', user: 'Bella Cosmetics' },
      { time: '2026-06-05 10:30', status: 'Picked Up', message: 'Rider Ram Bahadur picked up package', user: 'Rider Ram' },
      { time: '2026-06-05 11:00', status: 'Arrived in Warehouse', message: 'Inbound scanned at warehouse central hub', user: 'Dispatcher' },
      { time: '2026-06-05 11:30', status: 'Sent to Delivery', message: 'Assigned to Rider Ram Bahadur on Lalitpur route', user: 'Dispatcher' },
    ],
  });

  console.log('[SEED] Packages created.');
  console.log('[SEED] ✅ Seed complete! Credentials:');
  console.log('  Admin:      admin@exdexpress.com / admin123');
  console.log('  Bella:      bella@exdexpress.com / vendor123');
  console.log('  Urban:      urban@exdexpress.com / vendor123');
  console.log('  Dispatcher: dispatcher@exdexpress.com / dispatch123');
  console.log('  Ram:        ram@exdexpress.com / rider123');
  console.log('  Shyam:      shyam@exdexpress.com / rider123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});
