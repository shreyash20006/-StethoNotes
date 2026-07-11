import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { Clock, Mail, CheckCircle2, Store, LogOut, Bell } from 'lucide-react';

export default function SellerPendingPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  // Guard: only seller_pending may view this page
  useEffect(() => {
    if (!user) { navigate('/seller/login'); return; }
    if (user.role === 'seller') { navigate('/seller/dashboard'); return; }
    if (user.role === 'student') { navigate('/dashboard'); return; }
    if (user.role === 'admin' || user.role === 'super_admin') { navigate('/admin'); return; }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/seller/login');
  };

  const steps = [
    { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: 'Application Submitted', done: true },
    { icon: <Clock className="w-5 h-5 text-amber-500" />, label: 'Under Review (24–48 hrs)', done: false },
    { icon: <Mail className="w-5 h-5 text-gray-400" />, label: 'Approval Email Sent', done: false },
    { icon: <Store className="w-5 h-5 text-gray-400" />, label: 'Seller Dashboard Unlocked', done: false },
  ];

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-100/60 blur-[80px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-8 shadow-2xl shadow-emerald-100/40 text-center">
          {/* Animated icon */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-200 mb-6 mx-auto"
          >
            <Clock className="w-10 h-10 text-white" />
          </motion.div>

          {/* Pulsing badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 mb-5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-700 text-xs font-semibold">Under Review</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-3">
            Application Pending Approval
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-2">
            Your seller account is currently under review by our team.
          </p>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            We will verify your profile and activate your account within <strong className="text-slate-700">24–48 hours</strong>. You'll receive an email at{' '}
            <strong className="text-emerald-600">{user?.email || 'your email'}</strong> once approved.
          </p>

          {/* Progress steps */}
          <div className="text-left bg-gradient-to-b from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 mb-6">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-4">Application Progress</p>
            <div className="flex flex-col gap-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    {step.icon}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-slate-700 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                  {step.done && (
                    <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Done</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notification hint */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6 text-left">
            <Bell className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Keep an eye on your inbox. We'll send an email to <strong>{user?.email}</strong> with next steps.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link to="/" className="btn-secondary py-3 text-sm font-semibold text-center">
              Browse Notes as Student
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Questions? Contact us at{' '}
          <a href="mailto:support@stethonotes.store" className="text-emerald-600 hover:underline">
            support@stethonotes.store
          </a>
        </p>
      </motion.div>
    </div>
  );
}
