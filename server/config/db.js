const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the URI from the environment.
 * Exits the process if the connection fails so the error is obvious.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
