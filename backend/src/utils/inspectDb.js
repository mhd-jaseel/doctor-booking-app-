const mongoose = require('mongoose');
const env = require('../config/env');
const Doctor = require('../models/doctor.model');
const Hospital = require('../models/hospital.model');
const DoctorSchedule = require('../models/doctorSchedule.model');

async function inspectDb() {
  await mongoose.connect(env.MONGO_URI);
  console.log('--- DB INSPECTION START ---');
  
  const allDoctors = await Doctor.find({}).lean();
  console.log(`Total Doctors in DB: ${allDoctors.length}`);
  allDoctors.forEach((d, i) => {
    console.log(`[${i+1}] Name: "${d.name}", isActive: ${d.isActive}, Specialization: "${d.specialization}", Mode: ${JSON.stringify(d.consultationModes)}, Hospitals: ${d.hospitals?.length || 0}`);
  });

  const allHospitals = await Hospital.find({}).lean();
  console.log(`\nTotal Hospitals/Facilities in DB: ${allHospitals.length}`);
  allHospitals.forEach((h, i) => {
    console.log(`[${i+1}] Name: "${h.name}", isActive: ${h.isActive}, FacilityType: "${h.facilityType}", City: "${h.city}"`);
  });

  console.log('--- DB INSPECTION END ---');
  process.exit(0);
}

inspectDb().catch(e => {
  console.error(e);
  process.exit(1);
});
