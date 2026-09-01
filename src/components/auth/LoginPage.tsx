import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  KeyRound,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { Logo } from '../common/Logo';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your registered email/phone and password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await login({ identifier: identifier.trim(), password });
      if (res.success) {
        if (!res.user?.onboardingCompleted) {
          onNavigate('/onboarding');
        } else {
          onNavigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    try {
      setSubmitting(true);
      const res = await login({ identifier: 'demo@sentinelfin.com', password: 'password123' });
      if (res.success) {
        if (!res.user?.onboardingCompleted) {
          onNavigate('/onboarding');
        } else {
          onNavigate('/');
        }
      }
    } catch (err: any) {
      setError('Demo login error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 px-4 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center mb-6 sm:mb-8">
        <Logo className="w-20 h-20 mx-auto mb-3 drop-shadow-[0_8px_16px_rgba(124,58,237,0.3)] hover:scale-105 transition-transform" />
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#FAF7F2] border-2 border-black rounded-full text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000] mb-2">
          <Fingerprint className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>Encrypted Gateway</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
          SentinelFin Login
        </h1>
        <p className="text-xs font-semibold text-black/60 mt-1">
          Secure access to real-time AI fraud defense &amp; UPI payments
        </p>
      </div>

      <NeoCard className="bg-white p-6 sm:p-7 space-y-6 shadow-[6px_6px_0px_#000000]">
        {error && (
          <div className="bg-red-50 border-2 border-black rounded-xl p-3.5 text-xs font-bold text-red-700 flex items-start gap-2.5 shadow-[2px_2px_0px_#000000] animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Phone Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Email or Phone Number</span>
              </label>
              <span className="text-[10px] font-bold text-black/40 uppercase">Required</span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. sujan@example.com or +91 98765 43210"
                className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3.5 pl-10 font-bold text-sm text-black placeholder:text-black/35 shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
                autoComplete="username"
              />
              <Mail className="w-4 h-4 text-black/40 absolute left-3.5 top-4 pointer-events-none" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Password</span>
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-[11px] font-black text-[#7C3AED] hover:underline cursor-pointer tracking-tight"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secret password"
                className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3.5 pl-10 pr-11 font-bold text-sm text-black placeholder:text-black/35 shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
                autoComplete="current-password"
              />
              <KeyRound className="w-4 h-4 text-black/40 absolute left-3.5 top-4 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-black/50 hover:text-black p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#7C3AED]" />}
              </button>
            </div>
          </div>

          {/* Sign In Primary Action Button */}
          <NeoButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center uppercase mt-3 shadow-[3px_3px_0px_#000000] py-3.5"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying Security Credentials...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Sign In to Sentinel</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </NeoButton>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t-2 border-black/15 w-full" />
          <span className="bg-white px-3 text-[10px] font-black uppercase tracking-widest text-black/50 absolute">
            Or Quick Access
          </span>
        </div>

        {/* Innovative One-Click Demo Login Tile */}
        <div className="bg-[#FAF7F2] border-2 border-black rounded-xl p-3.5 shadow-[3px_3px_0px_#000000] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#7C3AED]" /> One-Click Sandbox
            </span>
            <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">
              Ready
            </span>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full bg-[#FFE17D] hover:bg-[#FCD34D] text-black border-2 border-black rounded-lg p-2.5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Zap className="w-4 h-4 text-black fill-black" />
            <span>Quick Sign In as Demo (Sujan)</span>
          </button>
        </div>

        {/* Signup redirection footer */}
        <div className="pt-2 text-center text-xs font-bold text-black/70">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => onNavigate('/signup')}
            className="text-[#7C3AED] hover:text-[#6D28D9] font-black uppercase text-xs tracking-tight underline cursor-pointer ml-1"
          >
            Create Account →
          </button>
        </div>
      </NeoCard>
    </div>
  );
};
