import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Package from '../../models/Package.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ktmexpress');
  console.log('Connected');

  const pkg = await Package.findOne({ trackingCode: '89WFQ1W' });
  if (!pkg) {
    console.log('Package not found');
  } else {
    console.log('Package:', pkg.trackingCode);
    console.log('Status:', pkg.status);
    console.log('Timeline:', JSON.stringify(pkg.timeline, null, 2));
  }
  process.exit(0);
}

run().catch(console.error);
