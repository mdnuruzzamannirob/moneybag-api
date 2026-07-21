import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';

type SmtpConfiguration = {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
};

const getSmtpConfiguration = async (): Promise<SmtpConfiguration> => {
  try {
    const setting = await prisma.globalSetting.findUnique({
      where: { key: 'smtp' },
    });
    if (
      setting?.value &&
      typeof setting.value === 'object' &&
      !Array.isArray(setting.value)
    ) {
      const value = setting.value as Record<string, unknown>;
      return {
        host: typeof value.host === 'string' ? value.host : env.SMTP_HOST,
        port: typeof value.port === 'number' ? value.port : env.SMTP_PORT,
        user: typeof value.user === 'string' ? value.user : env.SMTP_USER,
        pass: typeof value.pass === 'string' ? value.pass : env.SMTP_PASS,
        from: typeof value.from === 'string' ? value.from : env.MAIL_FROM,
      };
    }
  } catch {
    // Email can still use environment configuration while the DB is unavailable.
  }
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM,
  };
};

const createTransporter = (configuration: SmtpConfiguration) => {
  if (!configuration.host || !configuration.port) {
    return null;
  }

  return nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.port === 465,
    auth:
      configuration.user && configuration.pass
        ? { user: configuration.user, pass: configuration.pass }
        : undefined,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });
};

export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
) => {
  if (env.NODE_ENV === 'test') return;
  const configuration = await getSmtpConfiguration();
  const transporter = createTransporter(configuration);

  if (!transporter) {
    console.info(
      `Email skipped; SMTP is not configured. To=${to}, subject=${subject}`,
    );
    return;
  }

  await transporter.sendMail({
    from: configuration.from ?? 'MoneyBag <no-reply@example.com>',
    to,
    subject,
    text,
    html,
  });
};

export const sendTemplateMail = async (
  templateName: string,
  to: string,
  context: Record<string, unknown>,
  fallback: { subject: string; body: string },
) => {
  let subjectSource = fallback.subject;
  let bodySource = fallback.body;
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { name: templateName },
    });
    if (template) {
      subjectSource = template.subject;
      bodySource = template.body;
    }
  } catch {
    // Defaults keep transactional email usable during partial outages.
  }

  const subject = Handlebars.compile(subjectSource, { noEscape: true })(context);
  const html = Handlebars.compile(bodySource)(context);
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  await sendMail(to, subject, text, html);
};
