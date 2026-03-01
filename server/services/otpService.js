const redis = require('redis');
const crypto = require('crypto');
const { sendOTPEmail: sendEmailOTP } = require('./mailerService');

// Redis client setup with production configuration
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  retry_delay_on_failover: 100,
  retry_delay_on_cluster_down: 300,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Client Connected');
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Redis with 10-minute TTL
const storeOTP = async (email, otp) => {
  try {
    const key = `otp:${email}`;
    await redisClient.setEx(key, 600, otp); // 10 minutes = 600 seconds
    return true;
  } catch (error) {
    console.error('Error storing OTP:', error);
    return false;
  }
};

// Verify OTP against Redis with 3-strike enforcement
const verifyOTP = async (email, providedOTP) => {
  try {
    // Check if user is blocked first
    const blocked = await isUserBlocked(email);
    if (blocked) {
      return { 
        success: false, 
        message: 'Account suspended due to too many failed attempts. Try again after 24 hours.',
        code: 'ACCOUNT_SUSPENDED'
      };
    }

    const key = `otp:${email}`;
    const storedOTP = await redisClient.get(key);
    
    if (!storedOTP) {
      return { success: false, message: 'OTP expired or not found' };
    }
    
    if (storedOTP !== providedOTP) {
      // Increment failed attempts
      const attempts = await incrementAttempts(email);
      const remaining = await getRemainingAttempts(email);
      
      if (remaining === 0) {
        return { 
          success: false, 
          message: 'Account suspended due to too many failed attempts. Try again after 24 hours.',
          code: 'ACCOUNT_SUSPENDED'
        };
      }
      
      return { 
        success: false, 
        message: `Invalid OTP. ${remaining} attempts remaining.`,
        remainingAttempts: remaining
      };
    }
    
    // Delete OTP and reset attempts after successful verification
    await redisClient.del(key);
    await resetAttempts(email);
    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'Verification failed' };
  }
};

// Increment attempt counter with 24-hour TTL
const incrementAttempts = async (email) => {
  try {
    const key = `attempts:${email}`;
    const attempts = await redisClient.incr(key);
    
    // Set TTL to 24 hours (86400 seconds) only on first attempt
    if (attempts === 1) {
      await redisClient.expire(key, 86400);
    }
    
    return attempts;
  } catch (error) {
    console.error('Error incrementing attempts:', error);
    return 0;
  }
};

// Check if user is blocked (exceeds 3 attempts)
const isUserBlocked = async (email) => {
  try {
    const key = `attempts:${email}`;
    const attempts = await redisClient.get(key);
    return parseInt(attempts || 0) >= 3;
  } catch (error) {
    console.error('Error checking block status:', error);
    return false;
  }
};

// Get remaining attempts
const getRemainingAttempts = async (email) => {
  try {
    const key = `attempts:${email}`;
    const attempts = await redisClient.get(key);
    return Math.max(0, 3 - parseInt(attempts || 0));
  } catch (error) {
    console.error('Error getting remaining attempts:', error);
    return 3;
  }
};

// Check resend cooldown (60 seconds)
const canResendOTP = async (email) => {
  try {
    const key = `resend_cooldown:${email}`;
    const canResend = await redisClient.get(key);
    return !canResend; // Returns false if cooldown is active
  } catch (error) {
    console.error('Error checking resend cooldown:', error);
    return true;
  }
};

// Set resend cooldown for 60 seconds
const setResendCooldown = async (email) => {
  try {
    const key = `resend_cooldown:${email}`;
    await redisClient.setEx(key, 60, 'blocked'); // 60 seconds cooldown
    return true;
  } catch (error) {
    console.error('Error setting resend cooldown:', error);
    return false;
  }
};

// Reset attempts counter (after successful verification)
const resetAttempts = async (email) => {
  try {
    const key = `attempts:${email}`;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Error resetting attempts:', error);
    return false;
  }
};

// Send OTP via email with suspension check
const sendOTPEmail = async (email) => {
  try {
    // Check if user is blocked before sending OTP
    const blocked = await isUserBlocked(email);
    if (blocked) {
      return {
        success: false,
        message: 'Account suspended due to too many failed attempts. Try again after 24 hours.',
        code: 'ACCOUNT_SUSPENDED'
      };
    }

    // Check resend cooldown
    const canResend = await canResendOTP(email);
    if (!canResend) {
      return {
        success: false,
        message: 'Please wait before requesting another OTP.',
        code: 'RESEND_COOLDOWN'
      };
    }

    const otp = generateOTP();
    
    // Store OTP in Redis
    const stored = await storeOTP(email, otp);
    if (!stored) {
      return {
        success: false,
        message: 'Failed to generate verification code. Please try again.',
        code: 'STORAGE_ERROR'
      };
    }
    
    // Send email
    const result = await sendEmailOTP(email, otp);
    
    if (result.success) {
      // Set resend cooldown after successful send
      await setResendCooldown(email);
      return {
        success: true,
        message: 'OTP sent successfully',
        remainingAttempts: await getRemainingAttempts(email)
      };
    } else {
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.',
        code: 'EMAIL_ERROR'
      };
    }
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      message: 'Failed to send verification code. Please try again.',
      code: 'SYSTEM_ERROR'
    };
  }
};

module.exports = {
  redisClient,
  generateOTP,
  storeOTP,
  verifyOTP,
  incrementAttempts,
  isUserBlocked,
  getRemainingAttempts,
  canResendOTP,
  setResendCooldown,
  resetAttempts,
  sendOTPEmail
};
