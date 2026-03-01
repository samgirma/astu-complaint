import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";
import api from "@/utils/api";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { validation, validatePassword } = usePasswordValidation();
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const token = searchParams.get('token');

  // Validate password whenever it changes
  useEffect(() => {
    if (formData.newPassword) {
      validatePassword(formData.newPassword);
    }
  }, [formData.newPassword, validatePassword]);

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/verify-reset-token?token=${token}`);
        
        if (response.data.success) {
          setTokenValid(true);
          setEmail(response.data.data.email);
        } else {
          setError(response.data.message || "Invalid or expired token");
          setTokenValid(false);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to verify reset token");
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    // Validate password strength
    if (!validation.isValid) {
      toast({
        title: "Error",
        description: "Password does not meet security requirements",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      });
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Password reset successfully. You can now log in with your new password.",
          variant: "default"
        });
        
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to reset password",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.newPassword && 
           formData.confirmPassword &&
           validation.isValid &&
           formData.newPassword === formData.confirmPassword;
  };

  // Loading state
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-destructive rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive-foreground" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Invalid Reset Link
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {error || "This password reset link is invalid or has expired."}
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Request New Reset Link
              </button>
              
              <button
                onClick={() => navigate('/auth')}
                className="w-full h-11 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Reset Your Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a new password for your account:
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Enter your new password"
                  className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <PasswordStrengthIndicator 
                  password={formData.newPassword} 
                  requirements={validation.requirements}
                />
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm your new password"
                  className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Reset Password
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
