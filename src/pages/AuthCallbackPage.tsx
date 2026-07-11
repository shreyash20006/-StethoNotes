import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase, getAdminRole, isLiveSupabase } from '../lib/supabase';
import { sendSellerApplicationReceivedEmail } from '../lib/brevo';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldX, Loader2 } from 'lucide-react';

// ============================================================
// AUTH CALLBACK PAGE
// Handles post-Google-OAuth redirect and enforces RBAC logic.
// ============================================================

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSession } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'denied' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const role = searchParams.get('role') as 'student' | 'seller' | 'admin' | null;
  const isMock = searchParams.get('mock') === 'true';

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // In live mode, Supabase exchanges the code automatically.
      // In mock mode, the session is already in localStorage.
      if (isLiveSupabase) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        );
        if (error) throw error;
      }

      // Get the current session
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      if (!session?.user) throw new Error('No session after OAuth callback.');

      const user = session.user;
      const email = user.email || '';
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
      const avatarUrl = user.user_metadata?.avatar_url || '';

      // --------------------------------------------------------
      // ADMIN LOGIN — whitelist check
      // --------------------------------------------------------
      if (role === 'admin') {
        const adminRole = getAdminRole(email);
        if (!adminRole) {
          // Not on whitelist — sign out and show access denied
          await supabase.auth.signOut();
          setStatus('denied');
          return;
        }

        // Upsert profile with admin role
        await supabase.from('profiles').upsert({
          id: user.id,
          email,
          full_name: fullName,
          name: fullName,
          avatar_url: avatarUrl,
          role: adminRole,
          status: 'active',
        }, { onConflict: 'id' });

        await checkSession();
        navigate('/admin', { replace: true });
        return;
      }

      // --------------------------------------------------------
      // SELLER LOGIN — create pending seller
      // --------------------------------------------------------
      if (role === 'seller') {
        // Check if already an approved seller
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', user.id)
          .single();

        if (existingProfile?.role === 'seller' && existingProfile?.status === 'approved') {
          await checkSession();
          navigate('/seller/dashboard', { replace: true });
          return;
        }

        // Upsert as seller_pending
        await supabase.from('profiles').upsert({
          id: user.id,
          email,
          full_name: fullName,
          name: fullName,
          avatar_url: avatarUrl,
          role: 'seller_pending',
          status: 'pending',
        }, { onConflict: 'id' });

        // Create seller_request record (ignore if already exists)
        const { data: existingReq } = await supabase
          .from('seller_requests')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!existingReq) {
          await supabase.from('seller_requests').insert({
            user_id: user.id,
            email,
            full_name: fullName,
            status: 'pending',
            applied_at: new Date().toISOString(),
          });

          // Send application received email (fire-and-forget)
          sendSellerApplicationReceivedEmail(email, fullName).catch(console.error);
        }

        await checkSession();
        navigate('/seller/application-pending', { replace: true });
        return;
      }

      // --------------------------------------------------------
      // STUDENT LOGIN — default
      // --------------------------------------------------------
      await supabase.from('profiles').upsert({
        id: user.id,
        email,
        full_name: fullName,
        name: fullName,
        avatar_url: avatarUrl,
        role: 'student',
        status: 'active',
      }, { onConflict: 'id' });

      await checkSession();
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      console.error('Auth callback error:', err);
      // In mock mode with no real error, just navigate based on role
      if (isMock) {
        await checkSession();
        if (role === 'admin') navigate('/admin', { replace: true });
        else if (role === 'seller') navigate('/seller/application-pending', { replace: true });
        else navigate('/dashboard', { replace: true });
        return;
      }
      setStatus('error');
      setErrorMsg(err.message || 'Authentication failed.');
    }
  };

  // ============================================================
  // ACCESS DENIED UI (Admin email not whitelisted)
  // ============================================================
  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-2">
            This account is not authorized to access the Admin Panel.
          </p>
          <p className="text-slate-500 text-xs mb-8">
            Only pre-approved administrator accounts may log in here.
          </p>
          <button
            onClick={() => navigate('/admin/login', { replace: true })}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-all"
          >
            ← Back to Admin Login
          </button>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // ERROR UI
  // ============================================================
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{errorMsg}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOADING UI (default)
  // ============================================================
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-slate-400 text-sm">Verifying your account…</p>
      </motion.div>
    </div>
  );
}
