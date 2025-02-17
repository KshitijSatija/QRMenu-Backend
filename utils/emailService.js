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
    subject: 'New sign in to your Focus Bias Member account',   // Subject of the email
    text: `Hello ${firstName} (${username}),\n\nYou have successfully logged into your account on ${timestamp}.\nIf this was you, then you don't need to do anything.\nIf this was not you, please reset your password immediately.\n\nRegards,\nTeam Focus Bias Media`, // Plain text body
    html: `<p>Hello <strong>${firstName}</strong> (${username}),</p>
           <p>You have successfully logged into your account on <strong>${timestamp}</strong>.</p>
           <p>If this was you, then you don't need to do anything.</p>
           <p>If this was not you, please <a href="">reset your password</a> immediately.</p>
           <p>Regards,<br>Team Focus Bias Media</p>`, // HTML body for better formatting
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
    subject: 'Welcome to Focus Bias Member',
    text: `Hi ${username},\n\nYou have successfully registered your account on ${timestamp}.\nWelcome to Focus Bias ${firstName}! We are excited to have you on board.\n\nRegards,\nTeam Focus Bias Media`,
    html: `<p>Hi <strong>${username}</strong>,</p>
           <p>You have successfully registered your account on <strong>${timestamp}</strong>.</p>
           <p>Welcome to Focus Bias ${firstName}! We are excited to have you on board.</p>
           <p>Regards,<br>Team Focus Bias Media</p>`,
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
    subject: 'Your OTP for Focus Bias Member Registration',
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


module.exports = { sendLoginConfirmation, sendRegistrationConfirmation,sendOTPEmail  };
