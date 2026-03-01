/**
 * Password validation service for strong password requirements
 */

const getPasswordRequirements = () => {
  return [
    {
      id: 'length',
      label: 'At least 8 characters',
      regex: /.{8,}/,
      met: false
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      regex: /[A-Z]/,
      met: false
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      regex: /[a-z]/,
      met: false
    },
    {
      id: 'number',
      label: 'One number',
      regex: /\d/,
      met: false
    },
    {
      id: 'special',
      label: 'One special character (!@#$%^&*)',
      regex: /[!@#$%^&*]/,
      met: false
    }
  ];
};

/**
 * Validate password against all requirements
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with requirements and overall validity
 */
const validatePassword = (password) => {
  const requirements = getPasswordRequirements();
  
  const validatedRequirements = requirements.map(req => ({
    ...req,
    met: req.regex.test(password)
  }));
  
  const allMet = validatedRequirements.every(req => req.met);
  
  return {
    isValid: allMet,
    requirements: validatedRequirements,
    score: validatedRequirements.filter(req => req.met).length,
    totalRequirements: requirements.length
  };
};

/**
 * Check if password meets minimum requirements (for login validation)
 * @param {string} password - Password to check
 * @returns {boolean} - Whether password meets minimum requirements
 */
const meetsMinimumRequirements = (password) => {
  const validation = validatePassword(password);
  return validation.isValid;
};

/**
 * Generate password strength score (0-5)
 * @param {string} password - Password to evaluate
 * @returns {number} - Strength score
 */
const getPasswordStrength = (password) => {
  const validation = validatePassword(password);
  return validation.score;
};

module.exports = {
  getPasswordRequirements,
  validatePassword,
  meetsMinimumRequirements,
  getPasswordStrength
};
