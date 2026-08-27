import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Package from '../../models/Package.js';
import ScanEvent from '../../models/ScanEvent.js';
import PickupRequest from '../../models/PickupRequest.js';
import CodHandover from '../../models/CodHandover.js';
import Settlement from '../../models/Settlement.js';
import Expense from '../../models/Expense.js';
import Allowance from '../../models/Allowance.js';
import AuditLog from '../../models/AuditLog.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const wipeOldData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://ktmadmin:ktmexpress_db_pass_2026@mongodb:27017/ktmexpress?authSource=admin';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database for data wipe.');

    console.log('🧹 Cleaning old operational data...');

    const [
      pkgResult,
      scanResult,
      pickupResult,
      codResult,
      settleResult,
      expResult,
      allowResult,
      auditResult,
      prodResult
    ] = await Promise.all([
      Package.deleteMany({}),
      ScanEvent.deleteMany({}),
      PickupRequest.deleteMany({}),
      CodHandover.deleteMany({}),
      Settlement.deleteMany({}),
      Expense.deleteMany({}),
      Allowance.deleteMany({}),
      AuditLog.deleteMany({}),
      Product.deleteMany({})
    ]);

    console.log(`📦 Packages deleted: ${pkgResult.deletedCount}`);
    console.log(`📡 Scan events deleted: ${scanResult.deletedCount}`);
    console.log(`🚚 Pickup requests deleted: ${pickupResult.deletedCount}`);
    console.log(`💵 COD handovers deleted: ${codResult.deletedCount}`);
    console.log(`💰 Settlements deleted: ${settleResult.deletedCount}`);
    console.log(`🧾 Expenses deleted: ${expResult.deletedCount}`);
    console.log(`🏷️ Allowances deleted: ${allowResult.deletedCount}`);
    console.log(`📝 Audit logs deleted: ${auditResult.deletedCount}`);
    console.log(`🛍️ Products deleted: ${prodResult.deletedCount}`);

    // Clean up non-admin users if desired, or keep active staff
    // Here we preserve admin accounts
    console.log('✅ All old operational test data wiped cleanly!');
    console.log('🔒 Admin accounts & Master Pricing Matrix preserved.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error wiping data:', error.message);
    process.exit(1);
  }
};

wipeOldData();
