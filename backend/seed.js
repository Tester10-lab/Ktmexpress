import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const cleanAndSeed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI is not defined');
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Production Seed Cleanup');

    const adminEmail = 'admin@exdexpress.com';
    
    // Clean up completely invalid users
    await User.deleteMany({ $or: [{ email: null }, { email: '' }] });

    const admins = await User.find({ email: adminEmail });
    
    if (admins.length !== 1) {
      console.log(`Found ${admins.length} admins. Wiping and recreating...`);
      await User.deleteMany({ email: adminEmail });
      
      const adminUser = new User({
        name: 'System Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        contact: '9800000000',
        status: 'Active',
        isSuperAdmin: true,
      });
      await adminUser.save();
      console.log('Clean slate: Admin created securely as Super Admin.');
    } else {
      console.log('Found exactly 1 admin. Resetting password and ensuring Super Admin status...');
      const admin = admins[0];
      admin.password = 'admin123';
      admin.isSuperAdmin = true;
      await admin.save(); // This triggers the bcrypt pre-save hook
      console.log('Admin password securely reset and Super Admin status verified.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup and seeding:', error);
    process.exit(1);
  }
};

cleanAndSeed();
