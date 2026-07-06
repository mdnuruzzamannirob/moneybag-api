import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });
};

export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.info(
      `Email skipped; SMTP is not configured. To=${to}, subject=${subject}`,
    );
    return;
  }

  await transporter.sendMail({
    from: env.MAIL_FROM ?? 'Expense Tracker <no-reply@example.com>',
    to,
    subject,
    text,
    html,
  });
};
