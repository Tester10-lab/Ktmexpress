import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Package from '../models/Package.js';
import User from '../models/User.js';
import Settlement from '../models/Settlement.js';

async function generateAndSendDailyBackup() {
  console.log('🚀 Starting Daily Database Email Backup...');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ktmexpress';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  const reportEmail = process.env.REPORT_EMAIL || process.env.SMTP_EMAIL;
  const reportEmailTo = process.env.REPORT_EMAIL_TO || process.env.ADMIN_EMAIL || reportEmail;
  const reportPassword = process.env.REPORT_EMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;

  if (!reportEmail || !reportPassword) {
    console.error('❌ Error: REPORT_EMAIL and REPORT_EMAIL_APP_PASSWORD must be configured in .env');
    process.exit(1);
  }

  // Fetch collections
  const [packages, users, settlements] = await Promise.all([
    Package.find().populate('vendorId', 'name businessName phone email').populate('riderId', 'name phone').lean(),
    User.find().select('-password').lean(),
    Settlement.find().lean(),
  ]);

  console.log(`📦 Loaded ${packages.length} packages, ${users.length} users, ${settlements.length} settlements.`);

  // Create Excel Workbook Backup
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KDM Express Automated System';
  workbook.created = new Date();

  // 1. Packages Sheet
  const pkgSheet = workbook.addWorksheet('Packages');
  pkgSheet.columns = [
    { header: 'Tracking Code', key: 'trackingCode', width: 18 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Verification', key: 'deliveryVerificationStatus', width: 16 },
    { header: 'Customer Name', key: 'customerName', width: 22 },
    { header: 'Phone', key: 'customerPhone', width: 15 },
    { header: 'Address', key: 'address', width: 28 },
    { header: 'City', key: 'city', width: 16 },
    { header: 'COD Amount (Rs.)', key: 'amount', width: 16 },
    { header: 'Delivery Charge (Rs.)', key: 'deliveryCharge', width: 18 },
    { header: 'Vendor Name', key: 'vendorName', width: 22 },
    { header: 'Rider Name', key: 'riderName', width: 20 },
    { header: 'Created Date', key: 'createdAt', width: 22 },
  ];

  packages.forEach(p => {
    pkgSheet.addRow({
      trackingCode: p.trackingCode || p._id.toString(),
      status: p.status,
      deliveryVerificationStatus: p.deliveryVerificationStatus || 'Pending',
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      address: p.address,
      city: p.city || 'Kathmandu',
      amount: p.amount || 0,
      deliveryCharge: p.deliveryCharge || 0,
      vendorName: p.vendorId?.businessName || p.vendorId?.name || 'N/A',
      riderName: p.riderId?.name || 'Unassigned',
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
    });
  });

  // 2. Users Sheet
  const userSheet = workbook.addWorksheet('Users');
  userSheet.columns = [
    { header: 'Name', key: 'name', width: 22 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Business Name', key: 'businessName', width: 24 },
  ];

  users.forEach(u => {
    userSheet.addRow({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status || 'Active',
      businessName: u.businessName || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `KDM_Express_Backup_${dateStr}.xlsx`;

  // Setup Transporter with Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: reportEmail,
      pass: reportPassword.replace(/\s+/g, ''), // Strip any accidental spaces in app password
    },
  });

  const mailOptions = {
    from: `"KDM Express Automated Backup" <${reportEmail}>`,
    to: reportEmailTo,
    subject: `📊 [Daily Backup] KDM Express Data Report - ${dateStr}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">📦 KDM Express Daily Data Backup</h2>
        <p style="color: #475569; font-size: 14px;">Here is the automated daily backup and operations report for <strong>${dateStr}</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 10px; text-align: left; color: #64748b;">Metric</th>
            <th style="padding: 10px; text-align: right; color: #64748b;">Count / Total</th>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; color: #334155;">Total Packages</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #0f172a;">${packages.length}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; color: #334155;">Delivered Packages</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #16a34a;">${packages.filter(p => p.status === 'Delivered').length}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; color: #334155;">Verified Deliveries</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #0284c7;">${packages.filter(p => p.deliveryVerificationStatus === 'Verified').length}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; color: #334155;">Registered Users</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #0f172a;">${users.length}</td>
          </tr>
        </table>

        <p style="color: #64748b; font-size: 13px;">The complete detailed dataset is attached as an Excel spreadsheet: <strong>${filename}</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">Automated system delivery generated by KDM Express Logistics Engine.</p>
      </div>
    `,
    attachments: [
      {
        filename,
        content: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  };

  console.log(`📧 Sending email from ${reportEmail} to ${reportEmailTo}...`);
  await transporter.sendMail(mailOptions);
  console.log('🎉 Email sent successfully!');

  await mongoose.disconnect();
  process.exit(0);
}

generateAndSendDailyBackup().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
