const User = require('../models/user.model');
const env = require('../config/env');
const { ROLES } = require('../constants');

/**
 * Bootstrap administrator user on server startup if not already existing.
 * Password is automatically hashed via User schema pre-save hook.
 */
const bootstrapAdmin = async () => {
  try {
    const adminEmail = (env.ADMIN_EMAIL || 'admin@doctorbooking.com').toLowerCase();
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log(`[Admin Bootstrap] Creating initial admin account for ${adminEmail}...`);
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: env.ADMIN_PASSWORD || 'Admin@12345',
        role: ROLES.ADMIN,
        isActive: true,
      });
      console.log('[Admin Bootstrap] Initial admin account successfully created.');
    } else {
      console.log(`[Admin Bootstrap] Admin account (${adminEmail}) already exists. Preserving password.`);
    }
  } catch (error) {
    console.error('[Admin Bootstrap Error]:', error.message);
  }
};

module.exports = bootstrapAdmin;
