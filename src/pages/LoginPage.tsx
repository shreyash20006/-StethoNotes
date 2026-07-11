import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Lock, Mail, User, Phone, KeyRound, UserCheck, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp, signIn, signInWithOtp, verifyOtp, signInWithGoogle, error, clearError } = useAuthStore();
  const { addToast } = useToastStore();

  const isSignUpParam = searchParams.get('signup') === 'true';
  const [isSignUp, setIsSignUp] = useState(isSignUpParam);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [submitting, setSubmitting] = useState(false);

  // OTP Login states
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  // Sync isSignUp tab with query params
  useEffect(() => {
    setIsSignUp(searchParams.get('signup') === 'true');
    // Reset OTP states on toggle
    setOtpSent(false);
    setOtpToken('');
  }, [searchParams]);

  // Navigate away if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // Handle errors from store
  useEffect(() => {
    if (error) {
      addToast('error', 'Authentication Failed', error);
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        const success = await signUp(email, password, name, phone, role);
        if (success) {
          addToast('success', 'Account Registered', `Welcome to StethoNotes, ${name}!`);
        }
      } else {
        if (loginMethod === 'password') {
          const success = await signIn(email, password);
          if (success) {
            addToast('success', 'Logged In', 'Welcome back to your study notes portal.');
          }
        } else {
          // OTP Flow
          if (!otpSent) {
            const success = await signInWithOtp(email.trim());
            if (success) {
              setOtpSent(true);
              addToast('success', 'OTP Sent', 'A 6-digit access code has been dispatched to your email.');
            }
          } else {
            const success = await verifyOtp(email.trim(), otpToken.trim());
            if (success) {
              addToast('success', 'Logged In', 'OTP verified. Welcome to StethoNotes.');
            }
          }
        }
      }
    } catch (err: any) {
      addToast('error', 'Auth Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper helper to load quick credentials
  const loadQuickCredentials = (roleType: 'student' | 'admin') => {
    if (roleType === 'admin') {
      setEmail('admin@stethonotes.com');
      setPassword('admin123');
      setIsSignUp(false);
      addToast('info', 'Loaded Admin Demo', 'Loaded Dr. Admin mock credentials. Click Log In.');
    } else {
      setEmail('student@stethonotes.com');
      setPassword('student123');
      setIsSignUp(false);
      addToast('info', 'Loaded Student Demo', 'Loaded Jane Doe mock credentials. Click Log In.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 min-h-[80vh] flex flex-col justify-center">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-cyan-soft relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[100px] pointer-events-none" />

        {/* Tab Headers */}
        <div className="flex border-b border-gray-100 mb-8">
          <button
            onClick={() => {
              setIsSignUp(false);
              navigate('/login');
            }}
            className={`flex-1 pb-4 text-center font-display font-bold text-sm transition-all border-b-2 ${
              !isSignUp
                ? 'border-accent text-primary'
                : 'border-transparent text-gray-400 hover:text-primary'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              navigate('/login?signup=true');
            }}
            className={`flex-1 pb-4 text-center font-display font-bold text-sm transition-all border-b-2 ${
              isSignUp
                ? 'border-accent text-primary'
                : 'border-transparent text-gray-400 hover:text-primary'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Brand logo header */}
        <div className="text-center mb-6">
          <h2 className="font-display font-extrabold text-2xl text-primary tracking-tight">
            Stetho<span className="text-accent">Notes</span> Portal
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {isSignUp
              ? 'Join 10k+ medics accessing toppers-curated material'
              : 'Unlock your downloaded PDFs and purchases history'}
          </p>
        </div>

        {/* Quick Demo Credentials Panel */}
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 mb-6 flex flex-col gap-2">
          <span className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider block">
            Quick Dev Test Logins
          </span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => loadQuickCredentials('student')}
              className="py-1.5 px-3 border bg-white rounded-lg hover:border-accent hover:bg-accent/5 text-[10px] font-sans font-semibold text-primary flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-accent" />
              <span>Student Profile</span>
            </button>
            <button
              onClick={() => loadQuickCredentials('admin')}
              className="py-1.5 px-3 border bg-white rounded-lg hover:border-accent hover:bg-accent/5 text-[10px] font-sans font-semibold text-primary flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-accent" />
              <span>Admin Profile</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Sign Up fields */}
          {isSignUp && (
            <>
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-semibold text-gray-400">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Phone number */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-semibold text-gray-400">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Role Select */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-semibold text-gray-400">Register as</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="border border-gray-200 focus:border-accent outline-none p-2.5 rounded-xl bg-white text-primary font-medium"
                >
                  <option value="student">Medical Student (Read & Buy Notes)</option>
                  <option value="admin">Administrator (Upload & Sell Notes)</option>
                </select>
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display font-semibold text-gray-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!isSignUp && loginMethod === 'otp' && otpSent}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary disabled:bg-gray-50 disabled:text-gray-400"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Toggle Login Method (Only when in Log In mode) */}
          {!isSignUp && (
            <div className="flex bg-gray-50 p-1 rounded-xl mb-1 text-[10px] font-medium font-sans">
              <button
                type="button"
                onClick={() => { setLoginMethod('password'); setOtpSent(false); }}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  loginMethod === 'password' ? 'bg-white text-primary shadow-sm font-semibold' : 'text-gray-400 hover:text-primary'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  loginMethod === 'otp' ? 'bg-white text-primary shadow-sm font-semibold' : 'text-gray-400 hover:text-primary'
                }`}
              >
                OTP Login
              </button>
            </div>
          )}

          {/* Password (Only show for signup or login-with-password) */}
          {(isSignUp || loginMethod === 'password') && (
            <div className="flex flex-col gap-1.5">
              <label className="font-display font-semibold text-gray-400">Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {/* OTP Token input (Only show when loginMethod === 'otp' and code has been sent) */}
          {!isSignUp && loginMethod === 'otp' && otpSent && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="font-display font-semibold text-gray-400">Enter 6-Digit Code</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary font-mono text-center tracking-widest text-base font-bold"
                />
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="button"
                onClick={async () => {
                  const success = await signInWithOtp(email.trim());
                  if (success) addToast('success', 'OTP Resent', 'Verification code resent.');
                }}
                className="text-[10px] text-right font-sans text-accent hover:underline mt-0.5"
              >
                Resend Code
              </button>
            </div>
          )}

          {/* Submit Auth CTA */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary py-3.5 mt-2 font-bold text-sm w-full shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {submitting
                ? 'Please wait...'
                : isSignUp
                ? 'Register Account'
                : loginMethod === 'otp'
                ? otpSent
                  ? 'Verify & Log In'
                  : 'Send Verification Code'
                : 'Log In to Portal'}
            </span>
          </button>

          {/* Or Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <span className="relative px-3 bg-white text-[10px] text-gray-400 font-sans uppercase">
              Or continue with
            </span>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={async () => {
              setSubmitting(true);
              try {
                await signInWithGoogle();
              } catch (err: any) {
                addToast('error', 'Google Auth Error', err.message);
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="w-full py-3 px-4 border border-gray-200 hover:border-accent hover:bg-accent/5 rounded-xl text-primary font-sans font-semibold text-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
}
