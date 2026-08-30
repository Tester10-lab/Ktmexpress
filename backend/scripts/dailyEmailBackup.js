import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: '/app/.env' });
dotenv.config({ path: '/app/backend/.env' });

import { sendDailyEmailBackup } from '../services/dailyReportService.js';

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://ktmadmin:ktmexpress_db_pass_2026@mongodb:27017/ktmexpress?authSource=admin';
  await mongoose.connect(mongoUri);
  const result = await sendDailyEmailBackup();
  console.log(result);
  await mongoose.disconnect();
  process.exit(result.success ? 0 : 1);
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
