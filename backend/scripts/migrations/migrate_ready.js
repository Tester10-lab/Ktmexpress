import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Package from '../../models/Package.js';
import ScanEvent from '../../models/ScanEvent.js';
import AuditLog from '../../models/AuditLog.js';

async function run() {
  console.log('=== Database Production Readiness Migration ===');
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // 1. Initialize isSettling field on all existing packages
  console.log('Migrating packages: Setting isSettling=false where unset...');
  const pkgRes = await Package.updateMany(
    { isSettling: { $exists: false } },
    { $set: { isSettling: false } }
  );
  console.log(`Updated ${pkgRes.modifiedCount} package documents.`);

  // 2. Build indexes programmatically to ensure readiness
  console.log('Syncing database indexes...');
  await Package.syncIndexes();
  console.log('Package indexes synced.');

  await ScanEvent.syncIndexes();
  console.log('ScanEvent indexes synced.');

  await AuditLog.syncIndexes();
  console.log('AuditLog indexes synced.');

  console.log('✅ Database migration and indexing completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
