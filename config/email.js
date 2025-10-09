// utils/sendEmail.js
import nodemailer from "nodemailer";

/**
 * Create reusable transporter using SMTP configuration.
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email helper function.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to || !subject) {
      throw new Error("Missing 'to' or 'subject' in email options");
    }

    const info = await transporter.sendMail({
      from: `"Restaurant Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw new Error("Email could not be sent");
  }
};
