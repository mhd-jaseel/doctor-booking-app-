const env = require('../config/env');
const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyPattern || {});
    if (fields.includes('schedule') && fields.includes('tokenNumber')) {
      message = 'This token is no longer available. Please select another token.';
    } else if (fields.includes('email')) {
      message = 'An account with this email address already exists.';
    } else if (fields.includes('doctor') && fields.includes('date')) {
      message = 'A schedule for this doctor on this date already exists.';
    } else if (fields.includes('user') && fields.includes('schedule')) {
      message = 'You have already joined the waiting list for this schedule.';
    } else if (fields.includes('user') && fields.includes('appointment')) {
      message = 'You have already rated this appointment.';
    } else {
      message = `Duplicate entry conflict detected for: ${fields.join(', ')}`;
    }
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'Image size must be 5 MB or less.';
    } else {
      statusCode = 400;
      message = `Image upload error: ${err.message}`;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Log in development
  if (env.NODE_ENV === 'development') {
    console.error(`[Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err);
  }

  return sendError(res, statusCode, message, errors);
};

module.exports = errorHandler;
