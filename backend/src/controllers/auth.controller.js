const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Registers a new user or admin account.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.register({ name, email, password, role });
  return sendSuccess(res, 201, 'Registration successful', result);
});

// Authenticates credentials and issues a JWT token.
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  return sendSuccess(res, 200, 'Login successful', result);
});

// Fetches the current logged-in user's profile.
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  return sendSuccess(res, 200, 'User profile fetched successfully', { user });
});

module.exports = {
  register,
  login,
  getMe,
};
