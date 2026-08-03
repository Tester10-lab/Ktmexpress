import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Package from '../../models/Package.js';
import Expense from '../../models/Expense.js';
import User from '../../models/User.js';
import { exportDailyExcel } from '../../controllers/adminController.js';
import ExcelJS from 'exceljs';

jest.setTimeout(30000);

describe('Admin Export Daily Excel Controller Endpoint', () => {
  let mongoServer;
  let admin, vendor;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    admin = await User.create({ name: 'Admin User', email: 'admin@test.com', password: 'password123', role: 'admin' });
    vendor = await User.create({ name: 'Test Vendor', email: 'vendor@test.com', password: 'password123', role: 'vendor' });

    await Package.create([
      {
        trackingCode: 'KTM-EXP-001',
        invoiceId: 'INV-001',
        customerName: 'John Doe',
        customerPhone: '9841000000',
        address: 'Thamel, Kathmandu',
        amount: 1200,
        deliveryCharge: 100,
        vendorReceivable: 1100,
        status: 'Delivered',
        vendorId: vendor._id,
        createdAt: new Date('2026-07-28T09:00:00Z'),
      },
      {
        trackingCode: 'KTM-EXP-002',
        invoiceId: 'INV-002',
        customerName: 'Jane Doe',
        customerPhone: '9841000001',
        address: 'Patan, Lalitpur',
        amount: 2000,
        deliveryCharge: 150,
        vendorReceivable: 1850,
        status: 'Pending',
        vendorId: vendor._id,
        createdAt: new Date('2026-07-28T10:00:00Z'),
      }
    ]);

    await Expense.create({
      riderId: admin._id,
      amount: 250,
      category: 'fuel',
      date: new Date('2026-07-28T00:00:00Z'),
      status: 'Approved'
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const mockRes = () => {
    const res = {
      headers: {},
      statusCode: 200,
      bufferData: null,
      setHeader(name, val) {
        this.headers[name] = val;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.jsonData = obj;
        return this;
      },
      write(chunk) {
        if (!this.bufferData) {
          this.bufferData = Buffer.from(chunk);
        } else {
          this.bufferData = Buffer.concat([this.bufferData, Buffer.from(chunk)]);
        }
      },
      end(chunk) {
        if (chunk) this.write(chunk);
      }
    };
    return res;
  };

  it('generates binary Excel stream with 2 sheets for daily export endpoint', async () => {
    const req = { user: admin, query: { date: '2026-07-28' } };
    const res = mockRes();

    await exportDailyExcel(req, res);

    expect(res.headers['Content-Type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['Content-Disposition']).toContain('attachment; filename="ktmexpress_daily_export_2026-07-28.xlsx"');
    expect(res.bufferData).toBeDefined();

    // Parse returned binary excel stream with ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.bufferData);

    expect(workbook.worksheets.length).toBe(2);
    expect(workbook.worksheets[0].name).toBe('Packages Detail');
    expect(workbook.worksheets[1].name).toBe('Daily Summary & Financials');

    const sheet1 = workbook.getWorksheet('Packages Detail');
    expect(sheet1.getCell('B3').value).toBe('KTM-EXP-002'); // sorted desc by createdAt
    expect(sheet1.getCell('B4').value).toBe('KTM-EXP-001');

    const sheet2 = workbook.getWorksheet('Daily Summary & Financials');
    expect(sheet2.getCell('B1').value).toContain('DAILY SUMMARY & FINANCIAL RECONCILIATION');
  });
});
