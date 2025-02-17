// models/OTPVerification.js
const mongoose = require('mongoose');

const OTPVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiry: { type: Date, required: true },
});

const OTPVerification = mongoose.model('OTPVerification', OTPVerificationSchema);

module.exports = OTPVerification;
