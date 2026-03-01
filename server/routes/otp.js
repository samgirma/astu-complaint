const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendOTPEmail, verifyOTP, isUserBlocked, getRemainingAttempts } = require('../services/otpService');
const { strictEmailValidation } = require('../services/emailVerificationService');

const router = express.Router();

// POST /api/auth/otp/send-otp - Send OTP to email
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

    // Strict email validation for ASTU domains only
    const emailValidation = await strictEmailValidation(email);
    
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.reason,
        code: emailValidation.code
      });
    }

    // Send OTP with built-in suspension and cooldown checks
    const result = await sendOTPEmail(email);
    
    if (!result.success) {
      const statusCode = result.code === 'ACCOUNT_SUSPENDED' ? 429 : 400;
      return res.status(statusCode).json({
        success: false,
        message: result.message,
        code: result.code,
        remainingAttempts: result.remainingAttempts
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email,
        remainingAttempts: result.remainingAttempts,
        cooldownActive: true
      }
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/otp/verify-otp - Verify OTP
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

    // Verify OTP with built-in 3-strike enforcement
    const verification = await verifyOTP(email, otp);
    
    if (!verification.success) {
      const statusCode = verification.code === 'ACCOUNT_SUSPENDED' ? 429 : 400;
      return res.status(statusCode).json({
        success: false,
        message: verification.message,
        code: verification.code,
        remainingAttempts: verification.remainingAttempts
      });
    }

    res.status(200).json({
      success: true,
      message: verification.message,
      data: {
        email,
        verified: true
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/otp/status - Check OTP status and remaining attempts
router.get('/status', async (req, res) => {
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

    res.status(200).json({
      success: true,
      data: {
        email,
        blocked,
        remainingAttempts,
        maxAttempts: 3
      }
    });

  } catch (error) {
    console.error('Error checking OTP status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
