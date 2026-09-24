const mongoose = require('mongoose');
const User = require('../models/user.model');
const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not authenticated. Please log in to gain access.', 401));
  }

  const decoded = verifyToken(token);

  // Guard: decoded.id must be a valid MongoDB ObjectId to avoid a CastError crash.
  // An invalid id (e.g. a placeholder from stale dev storage) is treated as an
  // expired / invalid token and returns 401 rather than a 500.
  if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
    return next(new AppError('Invalid authentication token. Please log in again.', 401));
  }

  const currentUser = await User.findById(decoded.id);

  if (!currentUser || !currentUser.isActive) {
    return next(new AppError('The user belonging to this token no longer exists or is inactive.', 401));
  }

  req.user = currentUser;
  next();
});

module.exports = { protect };
