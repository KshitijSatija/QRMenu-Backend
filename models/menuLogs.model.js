// models/log.model.js

const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, // e.g., "create", "update", "delete"
  targetType: { type: String, enum: ["Menu"], required: true }, // Could be extended later
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // e.g., Menu._id
  details: { type: Object }, // Optional: Include diff or extra info
  ipAddress: { type: String }, // Optionally log IP
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MenuLog", logSchema);
