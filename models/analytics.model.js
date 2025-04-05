const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  restaurantName: { type: String, required: true },
  visitTimestamp: { type: Date, default: Date.now },
  duration: { type: Number }, // Time spent on menu in seconds
  viewedSections: { type: [String] }, // Track sections viewed
  referrer: { type: String }, // Source of visit
  ipAddress: { type: String }, // Capture user IP
});

module.exports = mongoose.model('Analytics', analyticsSchema);
