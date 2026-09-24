/**
 * Safe cleanup script: removes obsolete healthcare service records from MongoDB.
 * Specifically targets:
 *   - Medical Colleges (slug: medical-colleges, medical_colleges)
 * Does NOT delete hospitals, clinics, or any other records.
 * Run once after deploying the updated app.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_booking_db';

const OBSOLETE_SLUGS = [
  'medical-colleges',
  'medical_colleges',
  'medical_college',
  // Add more slugs here if needed in future
];

const OBSOLETE_NAMES = [
  'Medical Colleges',
  'Medical College',
];

async function cleanupObsoleteServices() {
  console.log('[Cleanup] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[Cleanup] Connected.');

  // Dynamic require after connection
  const HealthcareService = require('../models/healthcareService.model');

  const filter = {
    $or: [
      { slug: { $in: OBSOLETE_SLUGS } },
      { name: { $in: OBSOLETE_NAMES } },
    ],
  };

  // Preview first
  const toDelete = await HealthcareService.find(filter).lean();
  if (toDelete.length === 0) {
    console.log('[Cleanup] ✅ No obsolete records found. Nothing to delete.');
  } else {
    console.log(`[Cleanup] Found ${toDelete.length} obsolete record(s) to remove:`);
    toDelete.forEach((s) => console.log(`  → _id=${s._id}  name="${s.name}"  slug="${s.slug}"`));

    const result = await HealthcareService.deleteMany(filter);
    console.log(`[Cleanup] ✅ Deleted ${result.deletedCount} record(s) successfully.`);
  }

  await mongoose.disconnect();
  console.log('[Cleanup] Done.');
}

cleanupObsoleteServices().catch((err) => {
  console.error('[Cleanup] Error:', err.message);
  process.exit(1);
});
