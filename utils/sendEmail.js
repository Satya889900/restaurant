// backend/utils/sendEmail.js
import nodemailer from "nodemailer";

const sendEmail = async ({ from, to, bcc, replyTo, subject, text, html }) => {
  try {
    // 1. Create a transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address from .env
        pass: process.env.EMAIL_PASS, // Your Gmail app password from .env
      },
    });

    // 2. Define email options
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || `"FineDine - Premium Restaurant Booking" <${process.env.EMAIL_USER}>`,
      to: to,
      bcc: bcc,
      replyTo: replyTo, // Use a specific reply-to if provided
      subject,
      text, // Plain text body
      html, // HTML body
    };

    // 3. Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    // To prevent the app from crashing, we throw an error that can be caught by the calling function.
    throw new Error("Email could not be sent. Please check your email configuration and credentials.");
  }
};

export default sendEmail;
