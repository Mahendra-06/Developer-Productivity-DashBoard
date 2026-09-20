import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  RotateCw, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Lock
} from 'lucide-react';
import { Button } from '../ui/Button';

interface EmailOtpVerificationViewProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<{ cooldownSeconds?: number } | void>;
  onLogout: () => void;
}

export const EmailOtpVerificationView: React.FC<EmailOtpVerificationViewProps> = ({
  email,
  onVerify,
  onResend,
  onLogout,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeInputIndex, setActiveInputIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [attemptsExceeded, setAttemptsExceeded] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second live resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus the first empty digit input on initial load
  useEffect(() => {
    const firstEmpty = digits.findIndex((d) => !d);
    const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
    inputRefs.current[targetIdx]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    setErrorMessage('');
    setSuccessNotice('');

    // Take only numbers
    const cleanValue = value.replace(/\D/g, '');

    // Handle multiple digits entered (e.g. typing fast or browser autofill)
    if (cleanValue.length > 1) {
      handlePastedContent(cleanValue);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanValue.slice(-1);
    setDigits(newDigits);

    // Auto-advance focus to next input
    if (cleanValue && index < 5) {
      setActiveInputIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        setActiveInputIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveInputIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      setActiveInputIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullOtp = digits.join('');
      if (fullOtp.length === 6) {
        submitVerification(fullOtp);
      }
    }
  };

  const handlePastedContent = (pastedData: string) => {
    const clean = pastedData.replace(/\D/g, '').slice(0, 6);
    if (!clean) return;

    const newDigits = [...digits];
    for (let i = 0; i < clean.length; i++) {
      newDigits[i] = clean[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(clean.length, 5);
    setActiveInputIndex(nextIndex);
    inputRefs.current[nextIndex]?.focus();

    if (clean.length === 6) {
      submitVerification(clean);
    }
  };

  const submitVerification = async (otpToVerify: string) => {
    if (otpToVerify.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessNotice('');

    try {
      await onVerify(otpToVerify);
    } catch (err: any) {
      const msg = err.message || 'Verification failed. The code may be invalid or expired.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('maximum') || msg.toLowerCase().includes('attempts exceeded')) {
        setAttemptsExceeded(true);
      }
      // Clear inputs for clean retry
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitVerification(digits.join(''));
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    setSuccessNotice('');

    try {
      const result = await onResend();
      const cooldown = (result && typeof result === 'object' && result.cooldownSeconds) ? result.cooldownSeconds : 60;
      setResendCooldown(cooldown);
      setAttemptsExceeded(false);
      setDigits(['', '', '', '', '', '']);
      setSuccessNotice('A new verification code has been dispatched to your email.');
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch a new verification code. Please wait and try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = digits.every((d) => d.length === 1);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-100 selection:bg-brand-500/20 selection:text-brand-300">
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* App Branding Badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 p-0.5 shadow-lg shadow-brand-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white font-mono">DMetrics</span>
            <span className="text-xs font-semibold px-2 py-0.5 ml-2 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Zero-Trust Auth
            </span>
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Verify your email
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              We've dispatched a 6-digit one-time password to:
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-brand-300 max-w-full truncate">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          </div>

          {/* Feedback Notices */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">
                <span>{errorMessage}</span>
                {attemptsExceeded && (
                  <p className="mt-1 font-semibold text-rose-200">
                    Click "Resend Code" below to receive a fresh verification code.
                  </p>
                )}
              </div>
            </div>
          )}

          {successNotice && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* 6-Digit OTP Form */}
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-2.5">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onFocus={() => setActiveInputIndex(idx)}
                  onPaste={(e) => {
                    e.preventDefault();
                    handlePastedContent(e.clipboardData.getData('text'));
                  }}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border transition-all outline-none ${
                    digit
                      ? 'bg-slate-800 border-brand-500/60 text-white shadow-lg shadow-brand-500/10'
                      : activeInputIndex === idx
                      ? 'bg-slate-800/80 border-brand-500 ring-2 ring-brand-500/20 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Submit Action */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-lg shadow-brand-500/25"
              disabled={!isComplete || isLoading}
              icon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              {isLoading ? 'Validating OTP...' : 'Verify & Launch Workspace'}
            </Button>
          </form>

          {/* Resend & Cooldown Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center space-y-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Didn't receive the email?</span>
              {resendCooldown > 0 ? (
                <span className="font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/50">
                  Resend in <strong className="text-white">{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="font-semibold text-brand-400 hover:text-brand-300 underline transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Sending...' : 'Resend Code'}</span>
                </button>
              )}
            </div>

            {/* Logout / Switch Account */}
            <button
              type="button"
              onClick={onLogout}
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 pt-1 text-[11px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out / Register with different email</span>
            </button>
          </div>
        </div>

        {/* Security Assurance Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Single-use OTP code expires in 10 minutes</span>
          </p>
        </div>
      </div>
    </div>
  );
};
