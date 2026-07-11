import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Package from './models/Package.js';
import ScanEvent from './models/ScanEvent.js';
import User from './models/User.js';

async function testScan() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');
    
    // Find a package
    const pkg = await Package.findOne({ status: 'Pending' });
    if (!pkg) return console.log('No pending package');
    console.log('Found package:', pkg.trackingCode);

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    const existingStatus = pkg.status;
    
    const updatedPkg = await Package.findOneAndUpdate(
      { _id: pkg._id },
      {
        $set: { status: 'In Warehouse' },
      },
      { new: true }
    );
    
    console.log('Updated package status to In Warehouse');
    
    try {
      const scanEvent = await ScanEvent.create({
        packageId: updatedPkg._id,
        trackingCode: updatedPkg.trackingCode,
        scannedBy: admin._id,
        scannerName: admin.name,
        scannerRole: admin.role,
        action: 'Confirm Warehouse Arrival',
        fromStatus: existingStatus,
        toStatus: 'In Warehouse',
        notes: 'Scanned via QR Scanner module at warehouse arrival',
        isAdminOverride: true
      });
      console.log('Created ScanEvent:', scanEvent._id);
    } catch(err) {
      console.error('Error creating ScanEvent:', err.message);
    }
    
    const count = await ScanEvent.countDocuments({ trackingCode: pkg.trackingCode });
    console.log('Total scan events for tracking code:', count);

  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}

testScan();
