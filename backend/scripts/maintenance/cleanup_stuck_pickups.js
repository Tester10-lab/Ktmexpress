import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import PickupRequest from '../../models/PickupRequest.js';
import Package from '../../models/Package.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ktmexpress');
  console.log('Connected to DB');

  const pickups = await PickupRequest.find({ status: { $in: ['pending', 'assigned'] } }).populate('packageId');
  console.log(`Found ${pickups.length} active pickup requests.`);

  let resolvedCount = 0;
  for (const p of pickups) {
    const pkg = p.packageId;
    if (pkg && ['In Warehouse', 'Out for Delivery', 'Delivered', 'Postponed', 'Cancelled', 'Returned', 'Returned to Vendor'].includes(pkg.status)) {
      p.status = 'completed';
      p.completedAt = new Date();
      await p.save();
      console.log(`✓ Resolved stuck pickup ${p._id} for package ${pkg.trackingCode} (Package status: ${pkg.status})`);
      resolvedCount++;
    }
  }

  console.log(`Successfully cleaned up ${resolvedCount} stuck pickup requests.`);
  process.exit(0);
}

run().catch(console.error);
