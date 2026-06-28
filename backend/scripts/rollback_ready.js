import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  console.log('Dropping newly added indexes...');
  // Package indexes
  try {
    await db.collection('packages').dropIndex('status_1_createdAt_-1');
    await db.collection('packages').dropIndex('trackingCode_1_deletedAt_1');
    console.log('Package indexes dropped.');
  } catch (e) { console.log('Index status_1_createdAt_-1 or trackingCode_1_deletedAt_1 did not exist.'); }

  // ScanEvent TTL index
  try {
    await db.collection('scanevents').dropIndex('createdAt_-1');
    // Recreate original index without TTL option
    await db.collection('scanevents').createIndex({ createdAt: -1 });
    console.log('ScanEvent TTL index reverted to standard index.');
  } catch (e) { console.error('ScanEvent rollback error:', e); }

  // AuditLog TTL index
  try {
    await db.collection('auditlogs').dropIndex('createdAt_-1');
    // Recreate original index without TTL option
    await db.collection('auditlogs').createIndex({ createdAt: -1 });
    console.log('AuditLog TTL index reverted to standard index.');
  } catch (e) { console.error('AuditLog rollback error:', e); }

  // Unset isSettling locks
  console.log('Removing isSettling field from Package collection...');
  await db.collection('packages').updateMany({}, { $unset: { isSettling: "" } });
  console.log('Field unset.');

  console.log('✅ Database rollback finished successfully.');
  process.exit(0);
}

run();
