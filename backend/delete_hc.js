const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const HealthcareService = require('./src/models/healthcareService.model');
  const res = await HealthcareService.deleteMany({ slug: { $in: ['home-consultation', 'home_visit'] } });
  console.log('Deleted healthcare services:', res);
  process.exit(0);
});
