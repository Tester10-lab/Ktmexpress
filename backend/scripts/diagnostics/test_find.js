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
  console.log('Connected');

  const pkgIdStr = '6a3eb661d05d2af9e40e70e3';
  const pkgId = new mongoose.Types.ObjectId(pkgIdStr);

  const byStr = await PickupRequest.findOne({ packageId: pkgIdStr });
  console.log('Found by String:', byStr ? byStr._id : 'None');

  const byObj = await PickupRequest.findOne({ packageId: pkgId });
  console.log('Found by ObjectId:', byObj ? byObj._id : 'None');

  const updateResStr = await PickupRequest.updateOne(
    { packageId: pkgIdStr, status: 'assigned' },
    { $set: { status: 'completed', completedAt: new Date() } }
  );
  console.log('Update result by String:', updateResStr);

  process.exit(0);
}

run().catch(console.error);
