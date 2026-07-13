import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Package from '../../models/Package.js';
import User from '../../models/User.js';
import { createPackageForVendor, bulkCreatePackagesForVendor } from '../../controllers/adminController.js';
import { createPackage } from '../../controllers/vendorController.js';
import { processCsvImport } from '../../utils/csvHelper.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Setup test users
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) admin = await User.create({ name: 'Admin Test', email: 'admin_test@test.com', password: 'pass', role: 'admin' });

  let vendor = await User.findOne({ role: 'vendor' });
  if (!vendor) vendor = await User.create({ name: 'Vendor Test', email: 'vendor_test@test.com', password: 'pass', role: 'vendor' });

  let rider = await User.findOne({ role: 'rider' });
  if (!rider) rider = await User.create({ name: 'Rider Test', email: 'rider_test@test.com', password: 'pass', role: 'rider' });

  const mockRes = () => {
    const res = {};
    res.status = () => res;
    res.json = (data) => { res.data = data; return res; };
    return res;
  };

  console.log('\n--- 1. Testing Admin Create Order ---');
  let req = { user: admin, body: { vendorId: vendor._id.toString(), customerName: 'A1', customerPhone: '1', address: '1', amount: 100 } };
  let res = mockRes();
  await createPackageForVendor(req, res);
  let p1 = res.data.data;
  console.log(`Initial Status: ${p1.status}`);
  console.log(`First Timeline: ${p1.timeline[0].message}`);

  console.log('\n--- 2. Testing Admin Bulk JSON ---');
  req = { user: admin, body: { vendorId: vendor._id.toString(), packages: [{ customerName: 'A2', customerPhone: '2', address: '2', amount: 200 }] } };
  res = mockRes();
  await bulkCreatePackagesForVendor(req, res);
  let p2 = res.data.data.created[0];
  console.log(`Initial Status: ${p2.status}`);
  console.log(`First Timeline: ${p2.timeline[0].message}`);

  console.log('\n--- 3. Testing Vendor Create Order ---');
  req = { user: vendor, body: { customerName: 'V1', customerPhone: '1', address: '1', amount: 100 } };
  res = mockRes();
  await createPackage(req, res);
  let p3 = res.data.data;
  console.log(`Initial Status: ${p3.status}`);
  console.log(`First Timeline: ${p3.timeline[0].message}`);

  console.log('\n--- 4. Testing CSV Bulk Upload (Admin/Vendor) ---');
  const csvContent = `customerName,customerPhone,address,amount\nCSV1,1,1,100`;
  const csvPath = path.join(__dirname, 'test.csv');
  fs.writeFileSync(csvPath, csvContent);
  const csvResult = await processCsvImport(csvPath, vendor._id.toString(), 'CSV Tester');
  const p4 = await Package.findById(csvResult.data[0]);
  console.log(`Initial Status: ${p4.status}`);
  console.log(`First Timeline: ${p4.timeline[0].message}`);
  fs.unlinkSync(csvPath);

  console.log('\n--- 5. Dispatching a Package to Rider ---');
  p1.status = 'Sorted';
  await Package.findByIdAndUpdate(p1._id, { status: 'Sorted' });
  
  // Verify Rider query doesn't match Sorted
  const riderQuery = {
    $or: [
      { riderId: rider._id, status: { $in: ['Out for Delivery', 'Postponed'] } },
      { riderId: rider._id, status: { $in: ['Delivered', 'Cancelled', 'Returned', 'Exchanged'] }, deliveryVerificationStatus: { $in: ['Pending', 'Reopened'] } }
    ]
  };
  let riderPkgs = await Package.find(riderQuery);
  let found = riderPkgs.some(p => p._id.toString() === p1._id.toString());
  console.log(`Appears in Rider Dashboard when Sorted? ${found}`);

  p1.status = 'Out for Delivery';
  p1.riderId = rider._id;
  await Package.findByIdAndUpdate(p1._id, { status: 'Out for Delivery', riderId: rider._id });
  
  // Verify Rider query matches Out for Delivery
  riderPkgs = await Package.find(riderQuery);
  found = riderPkgs.some(p => p._id.toString() === p1._id.toString());
  console.log(`Appears in Rider Dashboard when Out for Delivery? ${found}`);

  mongoose.disconnect();
}

verify().catch(console.error);
