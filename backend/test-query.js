import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/logistic-system');

import('./models/PickupRequest.js').then(async (PickupRequestModule) => {
  const PickupRequest = PickupRequestModule.default;
  try {
    const pickups = await PickupRequest.find({ status: { $in: ['pending', 'assigned'] } })
      .populate('packageId', 'trackingCode customerName address vendorId')
      .populate('vendorId', 'name vendorMeta')
      .populate('assignedRiderId', 'name')
      .sort({ requestedAt: -1 });
    console.log('Success:', pickups.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
});
