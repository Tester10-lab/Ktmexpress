import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../../config/db.js';
import Package from '../../models/Package.js';

dotenv.config();

const deletePackages = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB via connectDB().');

    const result = await Package.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} packages.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting packages:', error.message);
    process.exit(1);
  }
};

deletePackages();
