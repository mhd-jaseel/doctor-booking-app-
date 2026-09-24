const ratingService = require('../services/rating.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const submitRating = asyncHandler(async (req, res) => {
  const rating = await ratingService.submitRating(req.user._id, req.body);
  return sendSuccess(res, 201, 'Rating submitted successfully', { rating });
});

module.exports = {
  submitRating,
};
