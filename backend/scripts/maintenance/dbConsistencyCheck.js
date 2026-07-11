import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../../models/User.js';
import Package from '../../models/Package.js';
import Settlement from '../../models/Settlement.js';
import CodHandover from '../../models/CodHandover.js';

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
}

async function run() {
  await connectDB();
  console.log('--- Ruflo V3 Database Consistency Audit ---');

  const inconsistencies = [];

  // 1. Settlement amount mismatch
  const settlements = await Settlement.find().populate('packageIds');
  for (const s of settlements) {
    const calculatedSum = s.packageIds.reduce((sum, p) => sum + ((p.amount || 0) - (p.deliveryCharge || 0)), 0);
    if (Math.abs(s.requestedAmount - calculatedSum) > 0.01) {
      inconsistencies.push({
        type: 'Settlement Amount Mismatch',
        id: s._id,
        details: `Settlement requestedAmount: ${s.requestedAmount}, calculated sum: ${calculatedSum}`
      });
    }
  }

  // 2. Approved Settlement Package Status mismatch
  const approvedSettlements = await Settlement.find({ status: 'Approved' });
  for (const s of approvedSettlements) {
    const unpaidPackages = await Package.find({ _id: { $in: s.packageIds }, vendorPaid: false });
    if (unpaidPackages.length > 0) {
      inconsistencies.push({
        type: 'Approved Settlement with Unpaid Packages',
        id: s._id,
        details: `${unpaidPackages.length} packages are still marked vendorPaid=false: ${unpaidPackages.map(p => p.trackingCode).join(', ')}`
      });
    }
  }

  // 3. Paid packages without approved settlements
  const paidPackages = await Package.find({ vendorPaid: true });
  for (const p of paidPackages) {
    const s = await Settlement.findOne({ packageIds: p._id, status: 'Approved' });
    if (!s) {
      inconsistencies.push({
        type: 'Paid Package without Approved Settlement',
        id: p._id,
        details: `Package ${p.trackingCode} is vendorPaid=true but has no corresponding approved Settlement`
      });
    }
  }

  // 4. Verified COD Handovers with unreconciled packages
  const verifiedHandovers = await CodHandover.find({ status: 'Verified' });
  for (const h of verifiedHandovers) {
    const unreconciledPkgs = await Package.find({ _id: { $in: h.packageIds }, cashReconciled: false });
    if (unreconciledPkgs.length > 0) {
      inconsistencies.push({
        type: 'Verified Handover with Unreconciled Packages',
        id: h._id,
        details: `${unreconciledPkgs.length} packages are still marked cashReconciled=false: ${unreconciledPkgs.map(p => p.trackingCode).join(', ')}`
      });
    }
  }

  // 5. Reconciled packages without verified handovers
  const reconciledPkgs = await Package.find({ cashReconciled: true, status: 'Delivered' });
  for (const p of reconciledPkgs) {
    const h = await CodHandover.findOne({ packageIds: p._id, status: 'Verified' });
    if (!h) {
      // Note: Admin might reconcile directly without handover, let's mark it as WARN
      console.log(`[INFO] Package ${p.trackingCode} is cashReconciled=true but not found in any Verified CodHandover.`);
    }
  }

  // 6. Packages with status 'Delivered' but no rider assigned
  const noRiderDelivered = await Package.find({ status: 'Delivered', riderId: null });
  if (noRiderDelivered.length > 0) {
    inconsistencies.push({
      type: 'Delivered Package with No Rider',
      details: `${noRiderDelivered.length} delivered packages have riderId=null`
    });
  }

  // Print results
  console.log(`\nAudit finished. Found ${inconsistencies.length} database inconsistencies.`);
  if (inconsistencies.length > 0) {
    console.log(JSON.stringify(inconsistencies, null, 2));
  } else {
    console.log('✅ Database is 100% consistent!');
  }

  process.exit(0);
}

run();
