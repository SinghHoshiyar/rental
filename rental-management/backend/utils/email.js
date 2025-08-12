const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const templates = {
  welcome: (data) => ({
    subject: 'Welcome to Rental Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Rental Management System!</h2>
        <p>Hi ${data.firstName},</p>
        <p>Thank you for registering with our rental management system.</p>
        <p>Best regards,<br>The Rental Management Team</p>
      </div>
    `,
    text: `Welcome ${data.firstName}! Thank you for registering.`
  }),

  'password-reset': (data) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${data.firstName},</p>
        <p>Click the link to reset your password: <a href="${data.resetUrl}">Reset Password</a></p>
        <p>This link expires in ${data.expiresIn}.</p>
      </div>
    `,
    text: `Hi ${data.firstName}, reset your password: ${data.resetUrl}`
  })
};

// Send email function
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    const transporter = createTransporter();
    let emailContent = {};

    if (template && templates[template]) {
      emailContent = templates[template](data);
    } else if (html || text) {
      emailContent = { subject, html, text };
    } else {
      throw new Error('Either template or html/text content must be provided');
    }

    const mailOptions = {
      from: `"Rental Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  templates
};