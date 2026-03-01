import { useState, useCallback } from 'react';

interface PasswordRequirement {
  id: string;
  label: string;
  regex: RegExp;
  met: boolean;
}

interface PasswordValidation {
  isValid: boolean;
  requirements: PasswordRequirement[];
  score: number;
  totalRequirements: number;
}

export const usePasswordValidation = () => {
  const [validation, setValidation] = useState<PasswordValidation>({
    isValid: false,
    requirements: [],
    score: 0,
    totalRequirements: 0
  });

  const getPasswordRequirements = useCallback((): PasswordRequirement[] => {
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
  }, []);

  const validatePassword = useCallback((password: string): PasswordValidation => {
    const requirements = getPasswordRequirements();
    
    const validatedRequirements = requirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
    
    const allMet = validatedRequirements.every(req => req.met);
    
    const result: PasswordValidation = {
      isValid: allMet,
      requirements: validatedRequirements,
      score: validatedRequirements.filter(req => req.met).length,
      totalRequirements: requirements.length
    };
    
    setValidation(result);
    return result;
  }, [getPasswordRequirements]);

  return {
    validation,
    validatePassword
  };
};
