import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import GlobalPricingSettings from './models/GlobalPricingSettings.js';
import OutsideValleyFee from './models/OutsideValleyFee.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function seedPricing() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not defined in .env');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Pricing Seed...');

  const excelPath = path.join(__dirname, '..', 'KDM_Express_Delivery_Charges.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  const sheet = workbook.getWorksheet('KDM Express Charges');
  const outsideValleyRates = [];
  let ktmRate = null;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 4) return;
    const vals = row.values;

    const parseCell = (locCol, rateCol) => {
      const loc = vals[locCol];
      const rate = vals[rateCol];
      if (loc && rate !== undefined && !isNaN(Number(rate))) {
        const locationName = String(loc).trim();
        const price = Number(rate);
        if (locationName.toLowerCase().includes('kathmandu')) {
          ktmRate = price;
        } else {
          outsideValleyRates.push({ city: locationName, fee: price });
        }
      }
    };

    parseCell(2, 3);
    parseCell(5, 6);
    parseCell(8, 9);
  });

  console.log(`Found Kathmandu Valley Rate: ${ktmRate}`);
  console.log(`Found ${outsideValleyRates.length} Outside Valley Locations`);

  // 1. Update Global Pricing Settings (KTM Base Rate = 100)
  const updatedGlobal = await GlobalPricingSettings.findByIdAndUpdate(
    'global',
    { ktmBaseRate: ktmRate || 100, weightSurchargePerKg: 50 },
    { new: true, upsert: true }
  );
  console.log('Updated Global Pricing Settings:', updatedGlobal);

  // 2. Upsert Outside Valley Fees
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of outsideValleyRates) {
    const uppercaseCity = item.city.toUpperCase();
    const existing = await OutsideValleyFee.findOne({ city: uppercaseCity });

    if (existing) {
      existing.fee = item.fee;
      existing.isActive = true;
      await existing.save();
      updatedCount++;
    } else {
      await OutsideValleyFee.create({
        city: uppercaseCity,
        fee: item.fee,
        isActive: true,
      });
      createdCount++;
    }
  }

  console.log(`Successfully processed Outside Valley Fees: ${createdCount} created, ${updatedCount} updated.`);
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seedPricing().catch((err) => {
  console.error('Error seeding pricing:', err);
  process.exit(1);
});
