import { useState, useEffect, useRef } from "react";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

interface OTPVerificationProps {
  email: string;
  onVerified: (email: string) => void;
  onBack: () => void;
}

const OTPVerification = ({ email, onVerified, onBack }: OTPVerificationProps) => {
  const { toast } = useToast();
  const [otp, setOTP] = useState(['', '', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(3);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus next input
  useEffect(() => {
    const firstEmptyIndex = otp.findIndex(digit => digit === '');
    if (firstEmptyIndex !== -1 && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  }, [otp]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOTP = pastedData.split('').slice(0, 6);
      setOTP([...newOTP, ...Array(6 - newOTP.length).fill('')]);
      // Focus last filled input
      const lastIndex = Math.min(newOTP.length - 1, 5);
      setTimeout(() => inputRefs.current[lastIndex]?.focus(), 0);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter all 6 digits",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/otp/verify-otp', {
        email,
        otp: otpString
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Email verified successfully",
        });
        onVerified(email);
      } else {
        setAttempts(response.data.remainingAttempts || attempts - 1);
        toast({
          title: "Error",
          description: response.data.message || "Invalid OTP",
          variant: "destructive"
        });
      }
    } catch (error) {
      const remainingAttempts = error.response?.data?.remainingAttempts || attempts - 1;
      setAttempts(remainingAttempts);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Verification failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/otp/send-otp', { email });

      if (response.data.success) {
        setTimer(60);
        setCanResend(false);
        setOTP(['', '', '', '', '', '', '']);
        setAttempts(response.data.remainingAttempts || 3);
        toast({
          title: "Success",
          description: "OTP resent successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to resend OTP",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to resend OTP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md mx-4 border border-white/20 shadow-black/20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border border-white/30">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify your Email</h2>
          <p className="text-white/80">We sent a 6-digit code to</p>
          <p className="font-semibold text-white/90">{email}</p>
        </div>

        {/* OTP Inputs */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-white/30 rounded-lg focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all bg-white/10 backdrop-blur-sm text-white placeholder-white/50"
                disabled={isLoading}
              />
            ))}
          </div>
          
          {/* Attempts Warning */}
          {attempts < 3 && (
            <p className="text-center text-sm text-amber-300/90 font-medium backdrop-blur-sm">
              {attempts} attempts remaining
            </p>
          )}
          
          {attempts === 1 && (
            <p className="text-center text-sm text-red-300/90 font-medium backdrop-blur-sm">
              Last attempt remaining
            </p>
          )}
        </div>

        {/* Timer and Resend */}
        <div className="text-center">
          {timer > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-white/70">
                Resend code in <span className="font-mono font-bold text-blue-300/90">{formatTime(timer)}</span>
              </p>
              <div className="flex items-center justify-center text-xs text-white/60">
                <div className="w-2 h-2 bg-blue-400/60 rounded-full animate-pulse mr-2"></div>
                Waiting for OTP...
              </div>
            </div>
          ) : (
            <button
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:from-blue-500/30 hover:to-purple-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-white/30 text-white/80 font-medium rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:from-green-500/30 hover:to-emerald-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-white/20"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </div>
            ) : (
              'Verify'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
