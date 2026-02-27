// Development email service that logs OTPs instead of sending emails
const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`🔢 OTP for ${email}: ${otp}`);
    console.log(`⏰ This OTP will expire in 10 minutes`);
    
    // In development, just log the OTP to console
    // In production, this would send a real email
    
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
      response: 'Development mode - OTP logged to console',
      otp: otp // Include OTP in response for development testing
    };
    
  } catch (error) {
    console.error(`❌ Failed to process OTP for ${email}:`, error);
    throw error;
  }
};

// Mock transporter verification
const verifyTransporter = async () => {
  console.log('✅ Development email service ready (OTP logging mode)');
  return true;
};

module.exports = {
  verifyTransporter,
  sendOTPEmail
};
