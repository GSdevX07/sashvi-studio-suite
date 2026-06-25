import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!host || !port || !user || !pass) {
  // eslint-disable-next-line no-console
  console.warn('SMTP not configured. Email sending will fail.');
}

export const transporter = nodemailer.createTransport({
  host,
  port,
  auth: {
    user,
    pass,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!host) {
    // eslint-disable-next-line no-console
    console.warn('Skipping email send — SMTP not configured');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to,
    subject,
    html,
  });
}
