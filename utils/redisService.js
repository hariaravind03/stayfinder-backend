const { createClient } = require('redis');

// Create Redis client
const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize Redis connection
let isConnected = false;

const initializeRedis = async () => {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }
};

// Handle Redis connection errors
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
  isConnected = false;
});

// Store OTP with expiration (10 minutes)
const storeOTP = async (email, otp) => {
  try {
    await initializeRedis();
    const key = `otp:${email}`;
    await client.set(key, otp);
    await client.expire(key, 600); // 10 minutes expiration
    return true;
  } catch (error) {
    console.error('Error storing OTP:', error);
    throw error;
  }
};

// Get OTP for email
const getOTP = async (email) => {
  try {
    await initializeRedis();
    const key = `otp:${email}`;
    return await client.get(key);
  } catch (error) {
    console.error('Error getting OTP:', error);
    throw error;
  }
};

// Delete OTP after successful verification
const deleteOTP = async (email) => {
  try {
    await initializeRedis();
    const key = `otp:${email}`;
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Error deleting OTP:', error);
    throw error;
  }
};

module.exports = {
  storeOTP,
  getOTP,
  deleteOTP
}; 