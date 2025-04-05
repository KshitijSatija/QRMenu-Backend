// utils/emailService.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

//create a transporter object using SMTP transport 
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,  // 'gmail' 
  auth: {
    user: process.env.EMAIL_USER,      // 
    pass: process.env.EMAIL_PASS       // This is your generated App Password
  }
});

// Get the current timestamp in a readable format
const getFormattedTimestamp = () => {
  const now = new Date();
  return now.toLocaleString(); // This gives the date and time in the user's local format
}

// Send login confirmation email
const sendLoginConfirmation = async (email, username, firstName) => {
  const timestamp = getFormattedTimestamp(); // Get the formatted timestamp

  const mailOptions = {
    from: process.env.EMAIL_USER,  // Sender address
    to: email,                    // Recipient address
    subject: 'New sign in to your QR Menu Member account',   // Subject of the email
    text: `Hello ${firstName} (${username}),\n\nYou have successfully logged into your account on ${timestamp}.\nIf this was you, then you don't need to do anything.\nIf this was not you, please reset your password immediately.\n\nRegards,\nTeam QR Menu`, // Plain text body
    html: `<p>Hello <strong>${firstName}</strong> (${username}),</p>
           <p>You have successfully logged into your account on <strong>${timestamp}</strong>.</p>
           <p>If this was you, then you don't need to do anything.</p>
           <p>If this was not you, please <a href="">reset your password</a> immediately.</p>
           <p>Regards,<br>Team QR Menu</p>`, // HTML body for better formatting
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Login confirmation sent to ${email}`);
  } catch (error) {
    console.error('Error sending login confirmation email:', error);
    throw new Error('Failed to send login confirmation email');
  }
};


// Send registration confirmation email
const sendRegistrationConfirmation = async (email, username, firstName) => {
  const timestamp = new Date().toLocaleString();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to QR Menu Member',
    text: `Hi ${username},\n\nYou have successfully registered your account on ${timestamp}.\nWelcome to QR Menu ${firstName}! We are excited to have you on board.\n\nRegards,\nTeam QR Menu`,
    html: `<p>Hi <strong>${username}</strong>,</p>
           <p>You have successfully registered your account on <strong>${timestamp}</strong>.</p>
           <p>Welcome to QR Menu ${firstName}! We are excited to have you on board.</p>
           <p>Regards,<br>Team QR Menu</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Registration confirmation sent to ${email}`);
  } catch (error) {
    console.error('Error sending registration confirmation email:', error);
    throw new Error('Failed to send registration confirmation email');
  }
};


// Send OTP email to the user
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for QR Menu Member Registration',
    text: `Your OTP for registration is ${otp}. This OTP is valid for 10 minutes.`,
    html: `<p>Your OTP for registration is <strong>${otp}</strong>. This OTP is valid for 10 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};


const sendDeleteOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for QR Menu Member Account Deletion',
    text: `Your OTP for account deletion is ${otp}. This OTP is valid for 5 minutes.`,
    html: `<p>Your OTP for account deletion is <strong>${otp}</strong>. This OTP is valid for 5 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

const sendContactFormConfirmation = async (email, firstName, company) => {
  const timestamp = new Date().toLocaleString();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Thanks for contacting QR Menu',
    text: `Hi ${firstName},\n\nThanks for reaching out to us at QR Menu on ${timestamp}.\nWe have received your message regarding your interest in QR Menu for your company "${company}".\n\nOur team will get back to you shortly.\n\nRegards,\nTeam QR Menu`,
    html: `<p>Hi <strong>${firstName}</strong>,</p>
           <p>Thanks for reaching out to us at <strong>QR Menu</strong> on <strong>${timestamp}</strong>.</p>
           <p>We have received your message regarding your interest in QR Menu for your company "<strong>${company}</strong>".</p>
           <p>Our team will get back to you shortly.</p>
           <p>Regards,<br>Team QR Menu</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    
  } catch (error) {
    
    throw new Error('Failed to send contact confirmation email');
  }
};

module.exports = { sendLoginConfirmation, sendRegistrationConfirmation,sendOTPEmail, sendDeleteOTPEmail, sendContactFormConfirmation };
