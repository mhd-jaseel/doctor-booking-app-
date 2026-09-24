const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const { generateToken } = require('../utils/jwt');
const { ROLES } = require('../constants');

// Handles user authentication, registration, and profile retrieval logic.
class AuthService {
  async register({ name, email, password, role }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Role can only be admin if first user or explicitly created with admin privileges
    const assignedRole = role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER;

    const user = await User.create({
      name: name ? name.trim() : email.split('@')[0],
      email: email.toLowerCase(),
      password,
      role: assignedRole,
    });

    const token = generateToken({ id: user._id, role: user.role });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    const token = generateToken({ id: user._id, role: user.role });

    return {
      user: {
        _id: user._id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }
}

module.exports = new AuthService();
