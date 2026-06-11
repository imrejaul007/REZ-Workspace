const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('./index');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error during MongoDB disconnect:', error);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };