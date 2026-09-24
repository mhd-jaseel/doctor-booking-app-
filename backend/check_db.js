require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor_booking_db');
  console.log('Connected to DB');

  const Appointment = mongoose.model('Appointment', new mongoose.Schema({}, { strict: false }));
  
  const total = await Appointment.countDocuments();
  console.log(`Total appointments: ${total}`);

  const apps = await Appointment.find({}).lean();
  console.log(apps);

  process.exit(0);
}

main().catch(console.error);
