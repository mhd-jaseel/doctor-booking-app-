const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateRating } = require('../validations');

router.use(protect);

router.post('/', validateRating, ratingController.submitRating);

module.exports = router;
