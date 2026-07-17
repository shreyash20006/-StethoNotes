import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Lock, Mail, User, Phone, KeyRound, ShieldAlert, Store } from 'lucide-react';

// Google SVG Icon
const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp, signIn, signInWithOtp, verifyOtp, signInWithGoogle, error, clearError } = useAuthStore();
  const { addToast } = useToastStore();

  const storedLogo = localStorage.getItem('brand_logo') || 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1783892715/file_00000000663871fa96d4e5a32de37be1_adwo6u.png';

  const isSignUpParam = searchParams.get('signup') === 'true';
  const refCodeParam = searchParams.get('ref') || '';
  const [isSignUp, setIsSignUp] = useState(isSignUpParam);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [refCode, setRefCode] = useState(refCodeParam);
  const [submitting, setSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  useEffect(() => {
    setIsSignUp(searchParams.get('signup') === 'true');
    setOtpSent(false);
    setOtpToken('');
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin/dashboard');
      else if (user.role === 'seller') navigate('/seller/dashboard');
      else if (user.role === 'seller_pending') navigate('/seller/application-pending');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

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
        const success = await signUp(email, password, name, phone, 'student');
        if (success) {
          addToast('success', 'Account Registered', `Welcome to StethoNotes, ${name}!`);
          // Attach referral if code provided
          if (refCode.trim()) {
            try {
              const { supabase } = await import('../lib/supabase');
              const { data: { session } } = await supabase.auth.getSession();
              const newUserId = session?.user?.id;
              const { data: referrer } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', refCode.trim().toUpperCase())
                .maybeSingle();
              if (referrer && newUserId && referrer.id !== newUserId) {
                await supabase.from('referrals').insert({
                  referrer_id: referrer.id,
                  referred_id: newUserId,
                  referral_code: refCode.trim().toUpperCase(),
                  status: 'signed_up',
                });
              }
            } catch (refErr) {
              console.error('Referral attribution failed:', refErr);
            }
          }
        }
      } else {
        if (loginMethod === 'password') {
          const success = await signIn(email, password);
          if (success) addToast('success', 'Logged In', 'Welcome back to your study notes portal.');
        } else {
          if (!otpSent) {
            const success = await signInWithOtp(email.trim());
            if (success) { setOtpSent(true); addToast('success', 'OTP Sent', 'A 6-digit code was sent to your email.'); }
          } else {
            const success = await verifyOtp(email.trim(), otpToken.trim());
            if (success) addToast('success', 'Logged In', 'OTP verified. Welcome to StethoNotes.');
          }
        }
      }
    } catch (err: any) {
      addToast('error', 'Auth Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try { await signInWithGoogle('student'); }
    catch (err: any) { addToast('error', 'Google Auth Error', err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-void min-h-screen flex items-center justify-center px-4 py-28 relative text-white">
      {/* Decorative gradients */}
      <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 animate-fade-in"
      >
        <div className="glass-card-v2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden shadow-[0_0_50px_-12px_rgba(31,182,212,0.15)]">
          {/* Decorative corner glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[120px] pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-4 overflow-hidden p-2 shadow-inner">
              <img src={storedLogo} alt="StethoNotes Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">
              Student <span className="text-primary">Portal</span>
            </h1>
            <p className="text-muted text-xs mt-2 leading-relaxed">
              {isSignUp ? 'Join 10,000+ medical students accessing topper notes' : 'Access your purchased study notes and guides'}
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-void/70 border border-white/5 p-1 rounded-2xl mb-7 text-xs font-semibold font-sans relative">
            <button
              onClick={() => { setIsSignUp(false); navigate('/login'); }}
              className={`flex-1 py-2.5 rounded-xl text-center transition-all duration-300 ${!isSignUp ? 'bg-white/10 text-white shadow-sm font-bold border border-white/5' : 'text-muted hover:text-white'}`}
            >
              Log In
            </button>
            <button
              onClick={() => { setIsSignUp(true); navigate('/login?signup=true'); }}
              className={`flex-1 py-2.5 rounded-xl text-center transition-all duration-300 ${isSignUp ? 'bg-white/10 text-white shadow-sm font-bold border border-white/5' : 'text-muted hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left text-xs">
            {/* Sign up fields */}
            {isSignUp && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display font-semibold text-muted">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required
                      className="w-full pl-10 pr-4 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white transition-all duration-200" 
                    />
                    <User className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display font-semibold text-muted">Phone Number</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      placeholder="9876543210" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white transition-all duration-200" 
                    />
                    <Phone className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-display font-semibold text-muted">Referral Code <span className="text-muted font-normal">(optional)</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="FRIEND1234"
                      value={refCode}
                      onChange={e => setRefCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white font-mono uppercase tracking-widest transition-all duration-200"
                      data-testid="signup-ref-code"
                    />
                    <KeyRound className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display font-semibold text-muted">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="john@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  disabled={!isSignUp && loginMethod === 'otp' && otpSent}
                  className="w-full pl-10 pr-4 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white disabled:bg-void/40 disabled:text-muted transition-all duration-200" 
                />
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Login method toggle */}
            {!isSignUp && (
              <div className="flex bg-void/70 border border-white/5 p-1 rounded-xl mb-1 text-[10px] font-semibold font-sans">
                <button 
                  type="button" 
                  onClick={() => { setLoginMethod('password'); setOtpSent(false); }}
                  className={`flex-1 py-2 rounded-lg text-center transition-all duration-350 ${loginMethod === 'password' ? 'bg-white/10 text-white shadow-sm font-bold border border-white/5' : 'text-muted hover:text-white'}`}
                >
                  Password
                </button>
                <button 
                  type="button" 
                  onClick={() => setLoginMethod('otp')}
                  className={`flex-1 py-2 rounded-lg text-center transition-all duration-350 ${loginMethod === 'otp' ? 'bg-white/10 text-white shadow-sm font-bold border border-white/5' : 'text-muted hover:text-white'}`}
                >
                  OTP Login
                </button>
              </div>
            )}

            {/* Password */}
            {(isSignUp || loginMethod === 'password') && (
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-semibold text-muted">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required
                    className="w-full pl-10 pr-4 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white transition-all duration-200" 
                  />
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            {/* OTP input */}
            {!isSignUp && loginMethod === 'otp' && otpSent && (
              <div className="flex flex-col gap-1.5">
                <label className="font-display font-semibold text-muted">6-Digit Code</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="123456" 
                    maxLength={6} 
                    value={otpToken}
                    onChange={e => setOtpToken(e.target.value.replace(/\D/g, ''))} 
                    required
                    className="w-full pl-10 pr-4 py-3.5 bg-void/50 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl text-white font-mono text-center tracking-widest text-base font-bold transition-all duration-200" 
                  />
                  <KeyRound className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-dark text-void font-display font-extrabold text-sm py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              <span>
                {submitting ? 'Please wait…'
                  : isSignUp ? 'Create Student Account'
                  : loginMethod === 'otp' ? (otpSent ? 'Verify & Log In' : 'Send Code')
                  : 'Log In'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
              <span className="relative px-3 bg-card/60 backdrop-blur-md text-[10px] text-muted font-sans uppercase">Or continue with</span>
            </div>

            {/* Google */}
            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              disabled={submitting}
              className="w-full py-3.5 px-4 border border-white/10 hover:border-primary/30 hover:bg-white/5 rounded-xl text-white font-sans font-semibold text-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Other portal links */}
          <div className="mt-7 pt-5 border-t border-white/5 flex flex-col gap-3 text-left">
            <Link to="/seller/login"
              className="flex items-center gap-2 text-xs text-muted hover:text-emerald-400 transition-colors">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Want to sell notes? <span className="font-semibold text-emerald-400">Seller Login →</span></span>
            </Link>
            <Link to="/admin/login"
              className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              <span>Administrator? <span className="font-semibold text-white">Admin Login →</span></span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
