import nodemailer from 'nodemailer';
import ExcelJS from 'exceljs';
import Package from '../models/Package.js';
import User from '../models/User.js';
import Settlement from '../models/Settlement.js';
import { logger } from '../config/logger.js';

export async function sendDailyEmailBackup() {
  const reportEmail = process.env.REPORT_EMAIL || process.env.SMTP_EMAIL || 'kdmexpress7@gmail.com';
  const reportEmailTo = process.env.REPORT_EMAIL_TO || process.env.ADMIN_EMAIL || 'maharjandiplon@gmail.com';
  const rawPassword = process.env.REPORT_EMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || '';
  const reportPassword = rawPassword.replace(/\s+/g, '');

  if (!reportEmail || !reportPassword) {
    const msg = 'REPORT_EMAIL_APP_PASSWORD is not configured in .env. Please set a 16-character Google App Password.';
    if (logger) logger.warn(msg);
    else console.warn(msg);
    return { success: false, message: msg };
  }

  try {
    if (logger) logger.info('Starting Daily Excel Email Report generation...');
    else console.log('Starting Daily Excel Email Report generation...');

    // Fetch collections
    const [packages, users, settlements] = await Promise.all([
      Package.find().populate('vendorId', 'name businessName phone email').populate('riderId', 'name phone').lean(),
      User.find().select('-password').lean(),
      Settlement.find().lean(),
    ]);

    // Create Excel Workbook Backup
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KDM Express Logistics System';
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
      { header: 'City / Destination', key: 'city', width: 18 },
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
        vendorName: p.vendorId?.vendorMeta?.shopName || p.vendorId?.businessName || p.vendorId?.name || 'N/A',
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
      { header: 'Business / Shop Name', key: 'businessName', width: 24 },
    ];

    users.forEach(u => {
      userSheet.addRow({
        name: u.name,
        email: u.email,
        phone: u.phone || u.contact || '',
        role: u.role,
        status: u.status || 'Active',
        businessName: u.vendorMeta?.shopName || u.businessName || '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `KDM_Express_Report_${dateStr}.xlsx`;

    // Setup Transporter with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: reportEmail,
        pass: reportPassword,
      },
    });

    const deliveredCount = packages.filter(p => p.status === 'Delivered').length;
    const verifiedCount = packages.filter(p => p.deliveryVerificationStatus === 'Verified').length;

    const mailOptions = {
      from: `"KDM Express Automated System" <${reportEmail}>`,
      to: reportEmailTo,
      subject: `📊 [Daily Report] KDM Express Operations & Data Backup - ${dateStr}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0; display: flex; align-items: center; gap: 8px;">
            📦 KDM Express Daily Operations & Backup
          </h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">
            Here is the automated daily summary and database operations report for <strong>${dateStr}</strong>.
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px 12px; text-align: left; color: #64748b; font-weight: 600;">Metric</th>
              <th style="padding: 10px 12px; text-align: right; color: #64748b; font-weight: 600;">Count</th>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; color: #334155;">Total System Packages</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #0f172a;">${packages.length}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; color: #334155;">Delivered Packages</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #16a34a;">${deliveredCount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; color: #334155;">Verified Deliveries</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #0284c7;">${verifiedCount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; color: #334155;">Registered Users</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #0f172a;">${users.length}</td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 13px;">
            The complete detailed spreadsheet is attached as <strong>${filename}</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
            Automated system dispatch generated by KDM Express Logistics Engine.
          </p>
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

    if (logger) logger.info(`Sending email report from ${reportEmail} to ${reportEmailTo}...`);
    else console.log(`Sending email report from ${reportEmail} to ${reportEmailTo}...`);

    await transporter.sendMail(mailOptions);

    if (logger) logger.info('Daily email report sent successfully!');
    else console.log('Daily email report sent successfully!');

    return { 
      success: true, 
      message: `Daily report sent successfully to ${reportEmailTo}`,
      packagesCount: packages.length,
      deliveredCount
    };
  } catch (err) {
    if (logger) logger.error(`Daily email report failed: ${err.message}`);
    else console.error(`Daily email report failed: ${err.message}`);
    return { success: false, message: err.message };
  }
}

/**
 * Schedule automated daily email dispatch in-process
 */
export function scheduleDailyEmailBackup() {
  const checkIntervalMs = 60 * 60 * 1000; // Check every hour
  let lastSentDate = '';

  setInterval(async () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentHour = now.getUTCHours(); // 18:00 UTC = 23:45 NPT

    if (currentHour === 18 && lastSentDate !== currentDate) {
      lastSentDate = currentDate;
      await sendDailyEmailBackup();
    }
  }, checkIntervalMs);

  if (logger) logger.info('Daily automated email scheduler initialized.');
}
