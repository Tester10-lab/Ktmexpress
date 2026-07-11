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

  const pickups = await PickupRequest.find({}).populate('packageId');
  console.log(`Total PickupRequests: ${pickups.length}`);

  const assigned = pickups.filter(p => p.status === 'assigned');
  console.log(`Assigned PickupRequests: ${assigned.length}`);

  for (const p of assigned) {
    const pkg = p.packageId;
    console.log(`Pickup ID: ${p._id}, Status: ${p.status}, Package ID: ${pkg?._id}, Package Status: ${pkg?.status}, Package TrackingCode: ${pkg?.trackingCode}`);
  }

  process.exit(0);
}

run().catch(console.error);
