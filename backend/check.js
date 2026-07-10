import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import Package from './backend/models/Package.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const pkgs = await Package.find({ customerName: { $regex: 'Test Admin Create' } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  console.log(JSON.stringify(pkgs, null, 2));
  process.exit(0);
}
run().catch(console.error);
