const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/user.model');
const Hospital = require('../models/hospital.model');
const Doctor = require('../models/doctor.model');
const DoctorSchedule = require('../models/doctorSchedule.model');
const Appointment = require('../models/appointment.model');
const Notification = require('../models/notification.model');
const Rating = require('../models/rating.model');
const WaitingList = require('../models/waitingList.model');
const { formatDate } = require('./dateHelper');
const {
  ROLES,
  FACILITY_TYPES,
  APPOINTMENT_STATUS,
} = require('../constants');

const seedDatabase = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[Seeder] Connected to MongoDB');

    // Clean existing collections and ensure any old fields are wiped
    await Promise.all([
      User.deleteMany({}),
      Hospital.deleteMany({}),
      Doctor.deleteMany({}),
      DoctorSchedule.deleteMany({}),
      Appointment.deleteMany({}),
      Notification.deleteMany({}),
      Rating.deleteMany({}),
      WaitingList.deleteMany({}),
    ]);
    await DoctorSchedule.syncIndexes();
    await Appointment.syncIndexes();
    console.log('[Seeder] Cleaned existing collections & synced indexes');

    // 1. Seed Initial Admin Account (Bootstrap Authentication)
    const adminUser = await User.create({
      name: 'System Administrator',
      email: (env.ADMIN_EMAIL || 'admin@doctorbooking.com').toLowerCase(),
      password: env.ADMIN_PASSWORD || 'Admin@12345',
      role: ROLES.ADMIN,
      isActive: true,
    });

    console.log(`[Seeder] Admin account initialized (${adminUser.email})`);
    console.log('[Seeder] Zero application seed data inserted. Database starts completely clean.');
    console.log('[Seeder] Database reset & admin initialization completed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
