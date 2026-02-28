const { validate: validateEmailDeep } = require('deep-email-validator');

/**
 * Strict email validation for ASTU student registration
 * Step A: Regex check for @astu.edu.et
 * Step B: Deep validation (Format, MX Records, SMTP check)
 */
const strictEmailValidation = async (email) => {
  try {
    console.log(`🔍 Starting strict email validation for: ${email}`);
    
    // Step A: Regex check for @astu.edu.et domain
    if (!email.endsWith('@astu.edu.et')) {
      return {
        valid: false,
        reason: 'Only ASTU institutional emails are allowed',
        code: 'INVALID_DOMAIN'
      };
    }
    
    console.log(`✅ Step A passed: Email ends with @astu.edu.et`);
    
    // Step B: Deep validation using deep-email-validator
    console.log(`🔍 Step B: Performing deep email validation...`);
    
    const validation = await validateEmailDeep(email);
    
    if (!validation.valid) {
      console.log(`❌ Step B failed: ${validation.reason}`);
      
      // Map common errors to user-friendly messages
      let errorMessage = 'Invalid email address';
      
      if (validation.reason) {
        if (validation.reason.includes('format')) {
          errorMessage = 'Invalid email format';
        } else if (validation.reason.includes('domain')) {
          errorMessage = 'Domain does not exist';
        } else if (validation.reason.includes('mx') || validation.reason.includes('MX')) {
          errorMessage = 'Domain does not have valid mail servers';
        } else if (validation.reason.includes('smtp') || validation.reason.includes('mailbox') || validation.reason.includes('typo')) {
          errorMessage = "The email doesn't exist. Check your email for any typo";
        } else {
          errorMessage = validation.reason;
        }
      }
      
      return {
        valid: false,
        reason: errorMessage,
        code: 'DEEP_VALIDATION_FAILED',
        details: validation
      };
    }
    
    console.log(`✅ Step B passed: Deep validation successful`);
    console.log(`📧 Validation details:`, {
      format: validation.format?.valid,
      mx: validation.mx?.valid,
      smtp: validation.smtp?.valid,
      reason: validation.reason
    });
    
    return {
      valid: true,
      reason: 'Email address is valid and can receive emails',
      code: 'VALID',
      details: validation
    };
    
  } catch (error) {
    console.error('❌ Strict email validation error:', error);
    return {
      valid: false,
      reason: 'Email verification failed. Please try again.',
      code: 'VALIDATION_ERROR'
    };
  }
};

/**
 * Quick email validation for registration (less strict)
 */
const quickEmailValidation = async (email) => {
  try {
    // Basic format validation
    if (!email.endsWith('@astu.edu.et')) {
      return {
        valid: false,
        reason: 'Only ASTU institutional emails are allowed',
        code: 'INVALID_DOMAIN'
      };
    }

    // Basic format check for ASTU emails
    const astuPattern = /^[a-zA-Z]+\.[a-zA-Z]+@astu\.edu\.et$/;
    if (!astuPattern.test(email)) {
      return {
        valid: false,
        reason: 'Email must be in format: firstname.lastname@astu.edu.et',
        code: 'INVALID_ASTU_FORMAT'
      };
    }

    return {
      valid: true,
      reason: 'Email format is valid',
      code: 'VALID_FORMAT'
    };

  } catch (error) {
    console.error('❌ Quick email validation error:', error);
    return {
      valid: false,
      reason: 'Email validation failed',
      code: 'VALIDATION_ERROR'
    };
  }
};

// Keep the old function for backward compatibility
const verifyEmailExists = async (email) => {
  return await strictEmailValidation(email);
};

module.exports = {
  strictEmailValidation,
  verifyEmailExists,
  quickEmailValidation
};
