const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.post('/log', analyticsController.logMenuVisit);


// Route to fetch analytics
router.get('/', analyticsController.getAllAnalytics);
module.exports = router;
