const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email helper
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Restaurant Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('📧 Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
