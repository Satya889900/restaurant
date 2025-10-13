// backend/utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async ({ to, subject, text, html }) => {
  // Create transporter (Gmail SMTP)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER, // Gmail address
      pass: process.env.EMAIL_PASS, // App password
    },
  });

  // Send email
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Restaurant Booking" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  console.log("✅ Email sent:", info.messageId);
  return info;
};

export default sendEmail;
