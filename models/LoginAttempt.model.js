const mongoose = require("mongoose");

const loginAttemptSchema = new mongoose.Schema({
  ipAddress: { type: String, required: true },
  username: { type: String }, 
  success: { type: Boolean, required: true }, 
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LoginAttempt", loginAttemptSchema);
