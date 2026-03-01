import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, User, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  initials: string;
  role: string;
}

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [step, setStep] = useState<'email' | 'confirmation' | 'success'>('email');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleCheckUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await api.post('/auth/check-user-for-password-reset', { email });
      
      if (response.data.success) {
        setUserProfile(response.data.data);
        setStep('confirmation');
        toast({
          title: "User Found",
          description: "Please confirm your profile to continue",
        });
      }
    } catch (error: any) {
      toast({
        title: "Account Not Found",
        description: error.response?.data?.message || "No account found with this email address",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAndSendEmail = async () => {
    if (!userProfile) return;

    try {
      setSubmitting(true);
      
      const response = await api.post('/auth/forgot-password', { 
        email: userProfile.email, 
        userId: userProfile.id 
      });
      
      if (response.data.success) {
        setEmailSent(true);
        setStep('success');
        toast({
          title: "Email Sent",
          description: "Password reset instructions have been sent to your email",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send password reset email",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Email Input Step
  if (step === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8">
            <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
            
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Forgot Password
              </h1>
              <p className="text-muted-foreground">
                Enter your email address to reset your password
              </p>
            </div>

            <form onSubmit={handleCheckUser} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Checking..." : "Continue"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User Confirmation Step
  if (step === 'confirmation' && userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8">
            <button
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Confirm Your Profile
              </h1>
              <p className="text-muted-foreground">
                Please confirm this is your account before we send the reset email
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                {userProfile.profilePicture ? (
                  <img
                    src={userProfile.profilePicture}
                    alt={userProfile.fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {userProfile.initials}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground">{userProfile.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Role: {userProfile.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span>Is this your account? If yes, confirm to send the password reset email.</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirmAndSendEmail}
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : "Yes, Send Reset Email"}
              </button>
              
              <button
                onClick={() => setStep('email')}
                className="w-full h-11 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                No, This Isn't Me
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Check Your Email
            </h1>
            
            <p className="text-muted-foreground mb-6">
              We've sent password reset instructions to:
              <br />
              <span className="font-medium text-foreground">{userProfile?.email}</span>
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-foreground">What's next?</p>
                  <p>Check your email and click the reset link to create a new password</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/auth"
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                Return to Login
              </Link>
              
              <button
                onClick={() => setStep('email')}
                className="w-full h-11 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                Try Another Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ForgotPassword;
