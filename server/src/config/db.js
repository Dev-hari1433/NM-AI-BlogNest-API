const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// Set reliable DNS servers on Windows to resolve mongodb+srv SRV records smoothly
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    // Fallback silently if system restricts setting DNS servers
  }
}

/**
 * Connect to MongoDB using Mongoose.
 * Validates MONGO_URI, logs connection host on success, and handles errors cleanly.
 */
const connectDB = async () => {
  const uri = env.MONGO_URI;

  if (!uri) {
    console.error('[DB ERROR] Database connection failed: MONGO_URI is missing in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[DB SUCCESS] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[DB ERROR] MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
