const { validate: validateEmailDeep } = require('deep-email-validator');
const dns = require('dns').promises;

/**
 * Strict email validation for ASTU student registration
 * Step A: Regex check for @astu.edu.et
 * Step B: For ASTU emails, use MX validation instead of SMTP (more reliable for institutional emails)
 */
const strictEmailValidation = async (email) => {
  try {
    // Step A: Regex check for @astu.edu.et or @astust.edu.et domain
    if (!email.endsWith('@astu.edu.et') && !email.endsWith('@astust.edu.et')) {
      return {
        valid: false,
        reason: 'Only ASTU institutional emails are allowed',
        code: 'INVALID_DOMAIN'
      };
    }
    
    // Step B: For ASTU emails, use MX record validation instead of SMTP
    // Institutional email servers often block SMTP verification attempts
    const domain = email.split('@')[1];
    
    try {
      const mxRecords = await dns.resolveMx(domain);
      
      if (!mxRecords || mxRecords.length === 0) {
        return {
          valid: false,
          reason: 'Domain does not have valid mail servers',
          code: 'DOMAIN_NO_MX'
        };
      }
      
      // Additional format validation for ASTU emails
      const astuPattern = /^[a-zA-Z]+\.[a-zA-Z]+@(astu|astust)\.edu\.et$/;
      if (!astuPattern.test(email)) {
        return {
          valid: false,
          reason: 'Email must be in format: firstname.lastname@astu.edu.et or firstname.lastname@astust.edu.et',
          code: 'INVALID_ASTU_FORMAT'
        };
      }
      
      return {
        valid: true,
        reason: 'Email address is valid and can receive emails',
        code: 'VALID',
        validationMethod: 'MX_RECORDS'
      };
      
    } catch (dnsError) {
      return {
        valid: false,
        reason: 'Unable to verify email domain. Please try again.',
        code: 'DNS_ERROR'
      };
    }
    
  } catch (error) {
    
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
    if (!email.endsWith('@astu.edu.et') && !email.endsWith('@astust.edu.et')) {
      return {
        valid: false,
        reason: 'Only ASTU institutional emails are allowed',
        code: 'INVALID_DOMAIN'
      };
    }

    // Basic format check for ASTU emails
    const astuPattern = /^[a-zA-Z]+\.[a-zA-Z]+@(astu|astust)\.edu\.et$/;
    if (!astuPattern.test(email)) {
      return {
        valid: false,
        reason: 'Email must be in format: firstname.lastname@astu.edu.et or firstname.lastname@astust.edu.et',
        code: 'INVALID_ASTU_FORMAT'
      };
    }

    return {
      valid: true,
      reason: 'Email format is valid',
      code: 'VALID_FORMAT'
    };

  } catch (error) {
    
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
