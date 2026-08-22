const User = require('../models/User');

/**
 * Seed one default super-admin on first run.
 * Runs at server startup; does nothing if any super-admin already exists.
 * Credentials come from .env (SEED_ADMIN_*).
 */
const seedSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'super-admin' });
    if (existing) return;

    const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
    if (!SEED_ADMIN_NAME || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
      console.warn('No super-admin exists and SEED_ADMIN_NAME/EMAIL/PASSWORD are not set — skipping seed.');
      return;
    }

    const admin = await User.create({
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      role: 'super-admin',
    });
    console.log(`Seeded default super-admin: ${admin.email}`);
  } catch (err) {
    console.error(`Failed to seed super-admin: ${err.message}`);
  }
};

module.exports = seedSuperAdmin;
