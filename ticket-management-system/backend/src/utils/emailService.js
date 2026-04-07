const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email function
exports.sendEmail = async (options) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `${process.env.EMAIL_FROM || 'noreply@ticketmanager.com'}`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Email templates
exports.emailTemplates = {
  ticketCreated: (ticket, user) => `
    <h2>Ticket Created Successfully</h2>
    <p>Hello ${user.name},</p>
    <p>Your ticket has been created successfully.</p>
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>ID:</strong> #${ticket._id.slice(-6)}</li>
      <li><strong>Priority:</strong> ${ticket.priority}</li>
      <li><strong>Status:</strong> ${ticket.status}</li>
    </ul>
    <p>We will get back to you as soon as possible.</p>
  `,
  
  ticketAssigned: (ticket, agent, assigner) => `
    <h2>New Ticket Assigned</h2>
    <p>Hello ${agent.name},</p>
    <p>You have been assigned a new ticket by ${assigner.name}.</p>
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>ID:</strong> #${ticket._id.slice(-6)}</li>
      <li><strong>Priority:</strong> ${ticket.priority}</li>
      <li><strong>Category:</strong> ${ticket.category}</li>
    </ul>
  `,
  
  ticketUpdated: (ticket, user, changes) => `
    <h2>Ticket Updated</h2>
    <p>Hello ${user.name},</p>
    <p>Your ticket has been updated.</p>
    <h3>Changes:</h3>
    <ul>
      ${changes.map(change => `<li>${change.field}: ${change.oldValue} → ${change.newValue}</li>`).join('')}
    </ul>
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>ID:</strong> #${ticket._id.slice(-6)}</li>
      <li><strong>Status:</strong> ${ticket.status}</li>
    </ul>
  `,
  
  commentAdded: (ticket, user, commenter) => `
    <h2>New Comment on Your Ticket</h2>
    <p>Hello ${user.name},</p>
    <p>${commenter.name} added a new comment to your ticket.</p>
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>ID:</strong> #${ticket._id.slice(-6)}</li>
    </ul>
  `,
  
  passwordReset: (user, resetToken) => `
    <h2>Password Reset Request</h2>
    <p>Hello ${user.name},</p>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `
};
