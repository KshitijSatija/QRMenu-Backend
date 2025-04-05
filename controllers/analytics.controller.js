const Analytics = require('../models/analytics.model');

exports.logMenuVisit = async (req, res) => {
  try {
    const { restaurantName, duration, viewedSections, referrer } = req.body;

    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    await Analytics.create({
      restaurantName,
      duration,
      viewedSections,
      referrer,
      ipAddress,
    });

    res.status(201).json({ message: 'Analytics recorded successfully' });
  } catch (error) {
    console.error('Error logging analytics:', error);
    res.status(500).json({ message: 'Error logging analytics', error: error.message });
  }
};


// Fetch all analytics for the admin dashboard
exports.getAllAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.find({});
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};
