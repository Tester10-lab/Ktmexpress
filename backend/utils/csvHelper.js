import fs from 'fs';
import csv from 'csv-parser';
import Package from '../models/Package.js';
import User from '../models/User.js';
import { generateLabelUrls } from '../services/labelService.js';
import { calculateDeliveryFee, getGlobalSettings } from '../services/pricingService.js';
import { uniqueTrackingCodes, generateInvoiceId } from './helpers.js';

// Hoisted helper: case-insensitive CSV column lookup
function getVal(row, keys, lowerRow) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
    const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lowerRow[lowerK] !== undefined && lowerRow[lowerK] !== '') return lowerRow[lowerK];
  }
  return undefined;
}

function buildLowerRow(row) {
  const lowerRow = {};
  for (const key of Object.keys(row)) {
    lowerRow[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[key];
  }
  return lowerRow;
}

export const processCsvImport = async (filePath, vendorId, creatorName) => {
  const MAX_ROWS = 500;
  const results = [];
  
  // Pre-fetch vendor and global pricing settings once (avoids N DB queries)
  const [vendor, globalSettings] = await Promise.all([
    User.findById(vendorId),
    getGlobalSettings(),
  ]);

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        rowCount++;
        if (rowCount > MAX_ROWS) {
          stream.destroy(new Error(`Exceeded maximum limit of ${MAX_ROWS} rows.`));
        } else {
          results.push(data);
        }
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('end', async () => {
        try {
          const packageDocs = [];
          const failedRows = [];

          // Pre-generate all tracking codes in batch (1 DB query instead of N)
          const validRows = [];
          for (let i = 0; i < results.length; i++) {
            const raw = results[i];
            const rowNumber = i + 2; // Data starts at line 2
            const lowerRow = buildLowerRow(raw);

            const invoiceId = getVal(raw, ['invoiceId', 'invoice', 'reference'], lowerRow)?.trim() || '';
            const customerName = getVal(raw, ['customerName', 'customer name', 'name'], lowerRow)?.trim() || '';
            const customerPhone = getVal(raw, ['customerPhone', 'customer phone', 'phone', 'contact'], lowerRow)?.trim() || '';
            const address = getVal(raw, ['address', 'delivery address', 'location'], lowerRow)?.trim() || '';
            const outOfValley = getVal(raw, ['outOfValley', 'out of valley', 'outside valley'], lowerRow);
            const city = getVal(raw, ['city', 'area', 'district'], lowerRow)?.trim() || '';
            const weightVal = getVal(raw, ['weight', 'kg'], lowerRow);
            const amountVal = getVal(raw, ['amount', 'cod', 'price'], lowerRow);

            const errors = [];
            if (!customerName) errors.push('Customer Name is required');
            if (!customerPhone) errors.push('Customer Phone is required');
            if (!address) errors.push('Delivery Address is required');

            const amount = Number(amountVal);
            if (isNaN(amount) || amountVal === undefined || amountVal === null || amountVal === '') {
              errors.push('Valid COD amount is required');
            } else if (amount < 0) {
              errors.push('COD amount cannot be negative');
            }

            const weight = weightVal ? Number(weightVal) : 0.5;
            if (isNaN(weight)) {
              errors.push('Weight must be a valid number');
            } else if (weight < 0.05) {
              errors.push('Weight must be at least 0.05 kg');
            }

            if (errors.length > 0) {
              failedRows.push({ row: rowNumber, errors, rawData: raw });
              continue;
            }

            validRows.push({ rowNumber, invoiceId, customerName, customerPhone, address, outOfValley, city, weight, amount, raw });
          }

          // Batch-generate tracking codes for all valid rows
          const trackingCodes = validRows.length > 0 ? await uniqueTrackingCodes(validRows.length) : [];

          for (let i = 0; i < validRows.length; i++) {
            const { rowNumber, invoiceId, customerName, customerPhone, address, outOfValley, city, weight, amount } = validRows[i];

            const outOfValleyParsed = String(outOfValley).toLowerCase() === 'true' || outOfValley === '1' || String(outOfValley).toLowerCase() === 'yes';

            let finalDeliveryCharge;
            try {
              finalDeliveryCharge = await calculateDeliveryFee({
                vendorId,
                outOfValley: outOfValleyParsed,
                city: city || '',
                weight: weight,
                _vendor: vendor,
                _globalSettings: globalSettings,
              });
            } catch (e) {
              finalDeliveryCharge = 0;
            }

            const trackingCode = trackingCodes[i];
            const labelUrls = generateLabelUrls(trackingCode);

            packageDocs.push({
              trackingCode,
              invoiceId: invoiceId || generateInvoiceId(),
              customerName,
              customerPhone,
              address,
              outOfValley: outOfValleyParsed,
              city: city || '',
              weight,
              items: [],
              amount,
              deliveryCharge: finalDeliveryCharge,
              vendorReceivable: Math.max(0, amount - finalDeliveryCharge),
              vendorId,
              ...labelUrls,
              status: 'In Warehouse',
              timeline: [{
                time: new Date().toISOString().replace('T', ' ').substring(0, 16),
                status: 'In Warehouse',
                message: 'Package arrived at warehouse.',
                user: creatorName,
              }],
              // store original row index for mapping DB errors back
              _csvRowIndex: rowNumber
            });
          }

          let createdPackages = [];
          if (packageDocs.length > 0) {
            try {
              createdPackages = await Package.insertMany(packageDocs, { ordered: false });
            } catch (err) {
              // Handle BulkWriteError
              if (err.name === 'BulkWriteError' || err.code === 11000) {
                if (err.insertedDocs) {
                  createdPackages = err.insertedDocs;
                }
                
                if (err.writeErrors) {
                  err.writeErrors.forEach(we => {
                    const failedDoc = packageDocs[we.index];
                    failedRows.push({
                      row: failedDoc._csvRowIndex,
                      errors: [we.errmsg || 'Database constraint violation'],
                      rawData: results[failedDoc._csvRowIndex - 2]
                    });
                  });
                }
              } else {
                throw err; // Re-throw other errors
              }
            }
          }

          // Sort failed rows by row index
          failedRows.sort((a, b) => a.row - b.row);

          resolve({
            success: failedRows.length === 0,
            importedCount: createdPackages.length,
            failedCount: failedRows.length,
            failedRows,
            message: `Import completed. ${createdPackages.length} succeeded, ${failedRows.length} failed.`,
            data: createdPackages
          });
        } catch (err) {
          reject(err);
        }
      });
  });
};

