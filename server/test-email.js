const { verifyTransporter } = require('./services/mailerService');

// Test email service configuration
const testEmailService = async () => {
  try {
    console.log('🧪 Testing email service configuration...');
    
    // Test transporter verification
    const isVerified = await verifyTransporter();
    console.log('Transporter verified:', isVerified);
    
    // Test environment variables
    console.log('SMTP Configuration:');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('From:', process.env.EMAIL_FROM);
    
    return isVerified;
  } catch (error) {
    console.error('Email service test failed:', error);
    return false;
  }
};

module.exports = { testEmailService };
