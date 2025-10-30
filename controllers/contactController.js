import User from "../models/userModel.js";
import Contact from "../models/Contact.js";
import asyncHandler from "express-async-handler";
import sendEmail from "../utils/sendEmail.js";

/**
 * @desc    Get public admin contact info
 * @route   GET /api/contact/admins
 * @access  Public
 */
export const getPublicAdmins = asyncHandler(async (req, res) => {
  // Find admins who have set their profile to public
  const admins = await User.find({ role: "admin", isPublic: true }).select(
    "name email phone address"
  );

  res.json(admins);
});

/**
 * @desc    Submit a contact form message
 * @route   POST /api/contact
 * @access  Public
 */
export const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  const subject = req.body.subject || "No Subject"; // Provide a default subject

  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Please fill in all fields.");
  }

  // 1. Save the message to the database first
  const contactMessage = await Contact.create({
    name,
    email,
    subject,
    message,
  });

  // 2. Find all admin users to send the email to
  const admins = await User.find({ role: "admin" }).select("email");
  const adminEmails = admins.map((admin) => admin.email);

  // Add a log to see if admins were found
  if (adminEmails.length === 0) {
    console.warn("CRITICAL: No admin users found. Contact form message was saved to DB but not sent.");
    // In a production environment, you might still want to return success.
    // For development, it's better to know the email failed.
    res.status(500);
    throw new Error("Message saved, but could not be sent. No admin recipients configured.");
  }

  // Respond to the user immediately for a faster experience
  res.status(201).json({
    message: "Your message has been sent successfully!",
    data: contactMessage,
  });

  // 3. Send the email in the background (fire-and-forget)
  const mainRecipient = adminEmails[0];
  const bccRecipients = adminEmails.slice(1);

  console.log(`Found ${adminEmails.length} admin(s). Sending email in background to: ${adminEmails.join(", ")}`);

  const emailSubject = `New Contact Form Message: ${subject}`;
  const emailText = `You have received a new message from:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4F46E5;">New Contact Form Message</h2>
      <p>You have received a new message from your website's contact form.</p>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Subject:</strong> ${subject}</p>
      <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <p style="margin: 0;">${message.replace(/\n/g, "<br>")}</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;">
      <p style="font-size: 0.9em; color: #777;">This is an automated notification from your Restaurant Booking System.</p>
    </div>
  `;

  // We don't use `await` here, so the user doesn't have to wait.
  sendEmail({
    from: `"${name} (via Restaurant Booking)" <${process.env.EMAIL_USER}>`,
    to: mainRecipient,
    bcc: bccRecipients.join(","),
    replyTo: email,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
  }).catch(error => {
    // Log any errors that happen during the background email sending.
    console.error("Background email sending for contact form failed:", error);
  });
});
