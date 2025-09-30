// backend/utils/sendEmail.js
import nodemailer from "nodemailer";
// const nodemailer = require"nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Restaurant Booking" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

export default sendEmail; // ✅ ESM default export
