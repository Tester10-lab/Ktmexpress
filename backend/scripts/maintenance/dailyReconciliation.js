import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Package from '../../models/Package.js';
import { connectDB } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const runReconciliation = async () => {
  try {
    await connectDB();
    logger.info('Starting Daily operational & financial reconciliation job...');

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // 1. Find packages pending verification older than 24 hours (SLA violation)
    const pendingViolations = await Package.find({
      deliveryVerificationStatus: 'Pending',
      'riderSubmission.submittedAt': { $lt: oneDayAgo }
    }).populate('riderId', 'name contact');

    // 2. Find packages with verification drafts saved
    const drafts = await Package.find({
      deliveryVerificationStatus: 'Pending',
      verificationDraft: { $ne: null }
    });

    // 3. Find packages with financial adjustments (COD differences)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const adjustments = await Package.find({
      'financialAdjustments.createdAt': { $gte: today }
    });

    // Calculate total adjustments difference
    let totalDifference = 0;
    adjustments.forEach(p => {
      p.financialAdjustments.forEach(adj => {
        if (adj.createdAt >= today) {
          totalDifference += adj.difference;
        }
      });
    });

    logger.info(`Reconciliation Results:
    - SLA Violations (Pending Verification > 24h): ${pendingViolations.length}
    - Saved Drafts: ${drafts.length}
    - Financial Adjustments Today: ${adjustments.length} (Net Change: Rs. ${totalDifference})
    `);

    // 4. Send Email report to admins if SLA violations exist or adjustments were made
    if (pendingViolations.length > 0 || adjustments.length > 0) {
      let emailBody = `<h3>Daily Verification & Reconciliation Report</h3>`;
      emailBody += `<p>Date: ${now.toLocaleDateString()}</p>`;
      
      if (pendingViolations.length > 0) {
        emailBody += `<h4>SLA Violations (Pending Verification > 24 hours)</h4>`;
        emailBody += `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th>Tracking Code</th>
            <th>Rider</th>
            <th>Submitted Status</th>
            <th>COD Amount</th>
            <th>Submitted At</th>
          </tr>`;
        pendingViolations.forEach(p => {
          emailBody += `<tr>
            <td>${p.trackingCode}</td>
            <td>${p.riderId?.name || 'Unknown'}</td>
            <td>${p.riderSubmission?.status || p.status}</td>
            <td>Rs. ${p.riderSubmission?.amount || p.amount}</td>
            <td>${new Date(p.riderSubmission?.submittedAt).toLocaleString()}</td>
          </tr>`;
        });
        emailBody += `</table>`;
      }

      if (adjustments.length > 0) {
        emailBody += `<h4>COD Differences Adjusted Today</h4>`;
        emailBody += `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th>Tracking Code</th>
            <th>Original Rider COD</th>
            <th>Verified COD</th>
            <th>Difference</th>
            <th>Reason</th>
            <th>Approved By</th>
          </tr>`;
        adjustments.forEach(p => {
          p.financialAdjustments.forEach(adj => {
            if (adj.createdAt >= today) {
              emailBody += `<tr>
                <td>${p.trackingCode}</td>
                <td>Rs. ${adj.originalAmount}</td>
                <td>Rs. ${adj.adjustedAmount}</td>
                <td style="color: ${adj.difference > 0 ? 'green' : 'red'}; font-weight: bold;">
                  ${adj.difference > 0 ? `+ Rs. ${adj.difference}` : `- Rs. ${Math.abs(adj.difference)}`}
                </td>
                <td>${adj.reason}</td>
                <td>${adj.adjustedByName}</td>
              </tr>`;
            }
          });
        });
        emailBody += `</table>`;
      }

      if (process.env.SMTP_EMAIL && process.env.SMTP_EMAIL !== 'your-smtp-email') {
        try {
          await sendEmail({
            to: process.env.FROM_EMAIL || 'admin@ktmexpress.com',
            subject: `Ktmexpress Daily Reconciliation Report - ${now.toLocaleDateString()}`,
            html: emailBody
          });
          logger.info('Daily reconciliation report email sent successfully.');
        } catch (mailErr) {
          logger.error(`Failed to send daily reconciliation email: ${mailErr.message}`);
        }
      } else {
        logger.info('SMTP is not configured. Skipping email delivery.');
      }
    }

    logger.info('Daily reconciliation job finished successfully.');
    process.exit(0);
  } catch (error) {
    logger.error(`Daily reconciliation job failed: ${error.message}`);
    process.exit(1);
  }
};

runReconciliation();
