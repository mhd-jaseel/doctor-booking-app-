const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: true, // Build compound indexes automatically in dev/testing
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host} (${conn.connection.name})`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    console.error('[MongoDB Error] Server starting without DB connection. API calls will fail until DB connects.');
  }
};

module.exports = connectDB;
