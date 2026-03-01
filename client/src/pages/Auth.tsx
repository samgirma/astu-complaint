import { useState, useCallback } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OTPVerification from "@/components/OTPVerification";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";
import api from "@/utils/api";

const Auth = () => {
  const { login, register, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { validation, validatePassword } = usePasswordValidation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  // Check if all requirements are met
  const isFormValid = useCallback(() => {
    if (isLogin) {
      return form.email && form.password && !emailError;
    } else {
      return form.email && form.password && form.confirmPassword && form.fullName &&
             !emailError && 
             validation.isValid && 
             !confirmPasswordError;
    }
  }, [form, isLogin, validation.isValid, emailError, confirmPasswordError]);

  // Memoized validation to prevent infinite loops
  const memoizedValidateEmail = useCallback((email) => {
    const astuPattern = /^[a-zA-Z]+\.[a-zA-Z]+@(astu|astust)\.edu\.et$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!astuPattern.test(email)) {
      setEmailError("Email must be in format: first.last@astu.edu.et or first.last@astust.edu.et");
      return false;
    }
    setEmailError("");
    return true;
  }, []);

  const memoizedValidateConfirmPassword = useCallback((password, confirmPassword) => {
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  }, []);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { isLogin, email: form.email, hasFullName: !!form.fullName });
    setSubmitting(true);

    try {
      if (isLogin) {
        // For login, authenticate directly without OTP
        console.log("Attempting login for:", form.email);
        const loginResult = await login(form.email, form.password);
        
        if (loginResult) {
          toast({ 
            title: "Success", 
            description: "Logged in successfully" 
          });
          
          // Check if user needs to change password
          if (loginResult.requiresPasswordChange) {
            // Redirect to change password page
            navigate("/change-password", { 
              state: { requiresPasswordChange: true, fromLogin: true } 
            });
          } else {
            // Normal login flow
            navigate("/");
          }
        } else {
          toast({ 
            title: "Error", 
            description: "Login failed" 
          });
        }
      } else {
        // For registration, send OTP first
        console.log("Attempting registration for:", form.email);
        
        // Validate password strength
        if (!validation.isValid) {
          toast({ 
            title: "Error", 
            description: "Password does not meet security requirements", 
            variant: "destructive" 
          });
          setSubmitting(false);
          return;
        }
        
        if (form.password !== form.confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
          setSubmitting(false);
          return;
        }
        
        console.log("Sending OTP request to:", `/auth/otp/send-otp`);
        const response = await api.post('/auth/otp/send-otp', { email: form.email });
        console.log("OTP response:", response.data);
        
        if (response.data.success) {
          setPendingEmail(form.email);
          setShowOTP(true);
          toast({ 
            title: "OTP Sent", 
            description: "Verification code sent to your email" 
          });
        } else {
          toast({ 
            title: "Error", 
            description: response.data.message || "Failed to send OTP",
            variant: "destructive" 
          });
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOTPVerified = async (email: string) => {
    try {
      console.log("Verifying OTP for:", email);
      // OTP verification is only for registration
      await register(email, form.password, form.fullName);
      toast({ title: "Account created!", description: "You can now sign in." });
      setIsLogin(true);
      setShowOTP(false);
      setForm({ email: "", password: "", fullName: "" });
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBackToForm = () => {
    setShowOTP(false);
    setPendingEmail("");
  };

  return (
    <div className="min-h-screen flex">
      {showOTP ? (
        <OTPVerification 
          email={pendingEmail} 
          onVerified={handleOTPVerified}
          onBack={handleBackToForm}
        />
      ) : (
        <>
          {/* Left: Branding panel */}
          <div className="hidden lg:flex lg:w-1/2 gradient-sidebar items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full overflow-hidden shadow-lg">
            <img 
              src="/favicon/apple-touch-icon.png" 
              alt="ASTU Logo" 
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-sidebar-primary mb-4">
            ASTU Smart Complaint & Issue Tracking
          </h1>
          <p className="text-sidebar-muted text-base leading-relaxed">
            Submit, track, and resolve campus issues efficiently.
            A transparent digital system for students, staff, and administrators.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Students", value: "2,400+" },
              { label: "Resolved", value: "89%" },
              { label: "Avg. Time", value: "2.3 days" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-sidebar-accent/50 p-4">
                <p className="text-xl font-bold text-sidebar-primary">{s.value}</p>
                <p className="text-xs text-sidebar-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-16 w-16 items-center justify-center rounded-full overflow-hidden shadow-lg">
              <img 
                src="/favicon/apple-touch-icon.png" 
                alt="ASTU Logo" 
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-lg font-bold text-foreground">ASTU Complaint Tracker</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-8">
            {isLogin
              ? "Sign in to manage your complaints."
              : "Sign up to start submitting complaints."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Samuel Girma"
                    className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => {
                    const newEmail = e.target.value;
                    setForm({ ...form, email: newEmail });
                    memoizedValidateEmail(newEmail);
                  }}
                  placeholder="first.last@astu.edu.et or first.last@astust.edu.et"
                  className={`w-full h-11 rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 ${
                    emailError ? 'border-red-500' : 'border-input'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => {
                    const newPassword = e.target.value;
                    setForm({ ...form, password: newPassword });
                    validatePassword(newPassword);
                  }}
                  placeholder="•••••••"
                  className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {!isLogin && form.password && (
                <div className="mt-3">
                  <PasswordStrengthIndicator 
                    password={form.password} 
                    requirements={validation.requirements} 
                  />
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.confirmPassword}
                    onChange={(e) => {
                      const newConfirmPassword = e.target.value;
                      setForm({ ...form, confirmPassword: newConfirmPassword });
                      memoizedValidateConfirmPassword(form.password, newConfirmPassword);
                    }}
                    placeholder="••••••"
                    className={`w-full h-11 rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 ${
                      confirmPasswordError ? 'border-red-500' : 'border-input'
                    }`}
                  />
                </div>
                {confirmPasswordError && (
                  <p className="text-xs text-red-500 mt-1">{confirmPasswordError}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-card"
            >
              {submitting ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? " Sign up" : " Sign in"}
            </button>
          </p>
          
          {isLogin && (
            <p className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot your password?
              </Link>
            </p>
          )}
        </div>
      </div>
        </>
    )}
    </div>
  );
};

export default Auth;
