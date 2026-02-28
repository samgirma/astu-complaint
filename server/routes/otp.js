const express = require('express');
const { body, validationResult } = require('express-validator');
const { generateOTP, storeOTP, verifyOTP, incrementAttempts, isUserBlocked, getRemainingAttempts, canResendOTP, setResendCooldown, resetAttempts, sendOTPEmail } = require('../services/otpService');
const { strictEmailValidation } = require('../services/emailVerificationService');

const router = express.Router();

// POST /api/auth/send-otp - Send OTP to email
router.post('/send-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Step A & B: Strict email validation (Domain + Deep validation)
    console.log(`🔍 Starting strict email validation for: ${email}`);
    const emailValidation = await strictEmailValidation(email);
    
    if (!emailValidation.valid) {
      console.log(`❌ Email validation failed: ${emailValidation.reason}`);
      return res.status(400).json({
        success: false,
        message: emailValidation.reason,
        code: emailValidation.code
      });
    }
    
    console.log(`✅ Email validation passed: ${email}`);

    // Check if user is blocked
    const blocked = await isUserBlocked(email);
    if (blocked) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again after 24 hours.',
        code: 'USER_BLOCKED'
      });
    }

    // Check resend cooldown
    const canResend = await canResendOTP(email);
    if (!canResend) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another OTP.',
        code: 'RESEND_COOLDOWN'
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const stored = await storeOTP(email, otp);
    if (!stored) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate OTP. Please try again.'
      });
    }

    // Increment attempt counter
    await incrementAttempts(email);

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    // Set resend cooldown
    await setResendCooldown(email);

    // Get remaining attempts
    const remainingAttempts = await getRemainingAttempts(email);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        email,
        remainingAttempts,
        cooldownActive: true
      }
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/auth/verify-otp - Verify OTP
router.post('/verify-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    // Check if user is blocked
    const blocked = await isUserBlocked(email);
    if (blocked) {
      return res.status(429).json({
        success: false,
        message: 'Account temporarily blocked due to too many failed attempts.',
        code: 'USER_BLOCKED'
      });
    }

    // Verify OTP
    const verification = await verifyOTP(email, otp);
    
    if (!verification.success) {
      // Increment failed attempts
      await incrementAttempts(email);
      const remainingAttempts = await getRemainingAttempts(email);
      
      return res.status(400).json({
        success: false,
        message: verification.message,
        remainingAttempts,
        code: 'INVALID_OTP'
      });
    }

    // Reset attempts on successful verification
    await resetAttempts(email);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email,
        verified: true
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/auth/otp-status - Check OTP status and remaining attempts
router.get('/otp-status', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const blocked = await isUserBlocked(email);
    const remainingAttempts = await getRemainingAttempts(email);
    const canResend = await canResendOTP(email);

    res.status(200).json({
      success: true,
      data: {
        email,
        blocked,
        remainingAttempts,
        canResend,
        maxAttempts: 3
      }
    });

  } catch (error) {
    console.error('Error checking OTP status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
