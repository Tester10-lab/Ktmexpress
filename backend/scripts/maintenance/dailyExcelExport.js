import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Package from '../../models/Package.js';
import Expense from '../../models/Expense.js';
import User from '../../models/User.js';
import { connectDB } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { buildDailyExcelWorkbook } from '../../utils/excelExport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Daily Excel Export CLI & Cron Job
 * Generates an Excel file with 2 sheets (Packages Detail + Daily Summary & Financials)
 * Usage:
 *   node backend/scripts/maintenance/dailyExcelExport.js
 *   node backend/scripts/maintenance/dailyExcelExport.js --date=2026-07-21
 */
export const runDailyExcelExport = async (targetDateStr = null, outDir = null) => {
  try {
    await connectDB();
    logger.info('Starting Daily Excel Export job...');

    const todayStr = targetDateStr || new Date().toISOString().split('T')[0];
    const targetDate = new Date(todayStr);

    const startOfDay = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

    // Fetch packages for the target date (or all if specified)
    const packages = await Package.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      deletedAt: null
    })
      .populate('vendorId', 'name vendorMeta')
      .populate('riderId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const expenses = await Expense.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      deletedAt: null
    }).lean();

    logger.info(`Fetched ${packages.length} packages and ${expenses.length} expenses for ${todayStr}.`);

    const workbook = await buildDailyExcelWorkbook({
      packages,
      expenses,
      dateStr: todayStr
    });

    const exportDirectory = outDir || path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportDirectory)) {
      fs.mkdirSync(exportDirectory, { recursive: true });
    }

    const filePath = path.join(exportDirectory, `daily_export_${todayStr}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    logger.info(`Daily Excel export generated successfully at: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error(`Daily Excel Export failed: ${error.message}`);
    throw error;
  }
};

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('dailyExcelExport.js')) {
  const args = process.argv.slice(2);
  let dateArg = null;
  args.forEach(arg => {
    if (arg.startsWith('--date=')) {
      dateArg = arg.split('=')[1];
    }
  });

  runDailyExcelExport(dateArg)
    .then((filePath) => {
      console.log(`\nSUCCESS: 2-sheet Excel file generated at ${filePath}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('ERROR generating Excel export:', err);
      process.exit(1);
    });
}
