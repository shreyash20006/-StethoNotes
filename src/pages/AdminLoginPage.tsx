import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { ShieldCheck, Lock, AlertTriangle, ChevronRight } from 'lucide-react';
import { ADMIN_EMAILS } from '../lib/supabase';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, error, clearError, loading } = useAuthStore();
  const { addToast } = useToastStore();
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already admin
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      addToast('error', 'Authentication Error', error);
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle('admin');
    } catch (err: any) {
      addToast('error', 'Google Auth Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || loading;
  const authorizedEmails = Object.keys(ADMIN_EMAILS);

  return (
    <div className="min-h-screen bg-[#07091a] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Deep navy background layers */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#07091a] via-[#0d1230] to-[#0a0f1e]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
      {/* Glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-[100px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none -z-10" />
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="fixed top-20 right-32 w-2 h-2 rounded-full bg-blue-400/60 -z-10"
      />
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        className="fixed bottom-32 left-40 w-1.5 h-1.5 rounded-full bg-indigo-300/60 -z-10"
      />

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Shield icon + header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600/50 shadow-2xl shadow-black/50 mb-5"
            >
              <ShieldCheck className="w-10 h-10 text-blue-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              Admin Portal
            </h1>
            <p className="text-slate-500 text-sm">
              StethoNotes — Restricted Access
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Warning banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
              <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-300 text-xs font-semibold mb-0.5">Authorized Personnel Only</p>
                <p className="text-amber-400/70 text-[11px] leading-relaxed">
                  Only pre-approved administrator accounts can access this panel. All login attempts are logged.
                </p>
              </div>
            </div>

            {/* Google Sign In */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isDisabled}
              className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <AnimatePresence mode="wait">
                {isDisabled ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin"
                  />
                ) : (
                  <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GoogleIcon />
                  </motion.div>
                )}
              </AnimatePresence>
              <span>{isDisabled ? 'Authenticating…' : 'Sign in with Google'}</span>
              {!isDisabled && (
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 ml-auto transition-colors" />
              )}
            </motion.button>

            {/* Authorized emails list */}
            <div className="mt-6 pt-5 border-t border-white/5">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-3">
                Authorized accounts
              </p>
              <div className="flex flex-col gap-2">
                {authorizedEmails.map((email) => {
                  const role = ADMIN_EMAILS[email];
                  return (
                    <div key={email} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-slate-400 text-xs font-mono">{email}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        role === 'super_admin'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400/70 shrink-0" />
              <p className="text-[10px] text-red-400/60 leading-relaxed">
                Unauthorized access attempts are monitored and reported.
              </p>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-6">
            <Link to="/login" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              ← Back to Student Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
