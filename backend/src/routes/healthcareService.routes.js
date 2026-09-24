const express = require('express');
const router = express.Router();
const healthcareServiceController = require('../controllers/healthcareService.controller');

// GET /api/healthcare-services (Public: returns active services sorted by displayOrder)
router.get('/', healthcareServiceController.getActiveServices);

module.exports = router;
