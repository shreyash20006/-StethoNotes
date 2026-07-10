import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Lock, Mail, User, Phone, KeyRound, UserCheck, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp, signIn, error, clearError } = useAuthStore();
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

  // Sync isSignUp tab with query params
  useEffect(() => {
    setIsSignUp(searchParams.get('signup') === 'true');
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
        const success = await signIn(email, password);
        if (success) {
          addToast('success', 'Logged In', 'Welcome back to your study notes portal.');
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
                className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl bg-white text-primary"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Password */}
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

          {/* Submit Auth CTA */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary py-3.5 mt-2 font-bold text-sm w-full shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>{submitting ? 'Please wait...' : isSignUp ? 'Register Account' : 'Log In to Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
