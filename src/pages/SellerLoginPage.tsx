import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Store, CheckCircle2, Clock, BookOpen, TrendingUp, GraduationCap } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const BENEFITS = [
  { icon: <TrendingUp className="w-5 h-5 text-emerald-450" />, text: 'Earn from every sale of your notes' },
  { icon: <BookOpen className="w-5 h-5 text-emerald-450" />, text: 'Upload PDFs, set your own price' },
  { icon: <GraduationCap className="w-5 h-5 text-emerald-450" />, text: 'Help thousands of medical students' },
  { icon: <CheckCircle2 className="w-5 h-5 text-emerald-450" />, text: 'Quality review & fast approval' },
];

export default function SellerLoginPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, error, clearError, loading } = useAuthStore();
  const { addToast } = useToastStore();
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in with appropriate role
  useEffect(() => {
    if (user) {
      if (user.role === 'seller') navigate('/seller/dashboard');
      else if (user.role === 'seller_pending') navigate('/seller/application-pending');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      addToast('error', 'Authentication Failed', error);
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle('seller');
    } catch (err: any) {
      addToast('error', 'Google Auth Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || loading;

  return (
    <div className="bg-void min-h-screen flex items-center justify-center px-4 py-28 relative overflow-hidden text-white">
      {/* Decorative gradients */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-56 h-56 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center relative z-10">
        {/* LEFT: Benefits panel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col gap-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
              <Store className="w-3.5 h-3.5" />
              Seller Portal
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-3">
              Share Your Knowledge,<br />
              <span className="text-emerald-400">Earn Passively</span>
            </h2>
            <p className="text-muted text-base leading-relaxed">
              Join India's leading medical notes marketplace. Upload your study notes and help thousands of students while earning money.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 p-4 bg-card/60 backdrop-blur-sm rounded-2xl border border-white/5 shadow-md text-white"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <span className="text-white font-medium text-sm">{b.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <Clock className="w-8 h-8 text-emerald-450 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">24–48 hour review</p>
              <p className="text-xs text-emerald-500">After submitting, our team reviews and approves your account quickly.</p>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Login card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="glass-card-v2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />

            {/* Icon + Title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-450 to-teal-500 shadow-lg mb-4"
              >
                <Store className="w-8 h-8 text-void" />
              </motion.div>
              <h1 className="font-bold text-2xl text-white mb-1">Seller Portal</h1>
              <p className="text-muted text-sm">Sign in with Google to access your seller dashboard</p>
            </div>

            {/* Process Steps */}
            <div className="bg-void/50 border border-white/5 rounded-2xl p-4 mb-6">
              <p className="text-xs font-semibold text-emerald-400 mb-3 uppercase tracking-wider">How it works</p>
              <div className="flex flex-col gap-2.5">
                {[
                  'Sign in with your Google account',
                  'Submit your seller profile for review',
                  'Get approved within 24–48 hours',
                  'Start uploading and earning!'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs text-muted">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isDisabled}
              className="w-full py-4 px-6 bg-white/5 border border-white/10 hover:border-emerald-500/35 hover:bg-white/10 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDisabled ? (
                <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-500 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>{isDisabled ? 'Connecting…' : 'Continue with Google'}</span>
            </motion.button>

            <p className="text-center text-[11px] text-muted mt-4 leading-relaxed">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
            </p>

            {/* Links */}
            <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-2 text-center">
              <Link to="/login" className="text-xs text-muted hover:text-primary transition-colors">
                Already a student? <span className="font-semibold text-primary">Student Login →</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
