const mongoose = require("mongoose");

const loginAttemptSchema = new mongoose.Schema({
  ipAddress: { type: String, required: true },
  username: { type: String }, // Optional: Track attempted usernames
  success: { type: Boolean, required: true }, // true for success, false for failure
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LoginAttempt", loginAttemptSchema);
