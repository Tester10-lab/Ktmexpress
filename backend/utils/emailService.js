import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Enterprise Email Notification Service
 * Uses environment variables for SMTP configuration.
 * Defaults to Ethereal email (mock) if not configured.
 */
const sendEmail = async (options) => {
  let transporter;

  // Setup SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Fallback to Ethereal for local dev
    logger.warn('SMTP config missing, falling back to Ethereal Email');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const message = {
    from: `${process.env.FROM_NAME || 'Logistic System Admin'} <${process.env.FROM_EMAIL || 'noreply@example.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  if (!process.env.SMTP_HOST) {
    logger.info(`Message sent: ${info.messageId}`);
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
};

export default sendEmail;
