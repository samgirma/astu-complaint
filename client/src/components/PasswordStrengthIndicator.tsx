import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  requirements: PasswordRequirement[];
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  requirements 
}) => {
  const allMet = requirements.every(req => req.met);
  const metCount = requirements.filter(req => req.met).length;

  const getStrengthColor = () => {
    if (metCount === 0) return 'text-red-500';
    if (metCount <= 2) return 'text-orange-500';
    if (metCount <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStrengthBarColor = () => {
    if (metCount === 0) return 'bg-red-500';
    if (metCount <= 2) return 'bg-orange-500';
    if (metCount <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (metCount === 0) return 'Very Weak';
    if (metCount <= 2) return 'Weak';
    if (metCount <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-3">
      {/* Password Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-muted-foreground">Password Strength</span>
          <span className={`text-xs font-bold ${getStrengthColor()}`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()}`}
            style={{ width: `${(metCount / requirements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Password must contain:</p>
        <div className="space-y-1">
          {requirements.map((requirement) => (
            <div 
              key={requirement.id} 
              className="flex items-center space-x-2 text-xs"
            >
              {requirement.met ? (
                <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )}
              <span className={requirement.met ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>
                {requirement.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
