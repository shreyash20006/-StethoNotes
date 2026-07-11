import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase, isLiveSupabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { sendSellerApplicationReceivedEmail } from '../lib/brevo';
import { ShieldX, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSession } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'denied' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const oauthState = searchParams.get('state') || searchParams.get('role') || 'student';
  const isMock = searchParams.get('mock') === 'true';

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
          // Fetch session first (standard client-side SDK might have already exchanged the code automatically)
      let { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      // If no session exists yet, try exchanging code manually
      if (!session && isLiveSupabase) {
        const code = searchParams.get('code');
        if (code) {
          try {
            const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeErr) {
              const { data: refreshed } = await supabase.auth.getSession();
              session = refreshed.session;
            }
          } catch (e) {
            console.warn('Manual PKCE code exchange failed; checking if session exists:', e);
          }
        }
      }

      // Re-fetch session one last time
      if (!session) {
        const { data: refreshed } = await supabase.auth.getSession();
        session = refreshed.session;
      }

      if (!session?.user) {
        throw new Error('No session after OAuth callback. If you are in mock mode, please ensure your browser has localStorage enabled.');
      }

      const user = session.user;
      const email = user.email || '';
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
      const avatarUrl = user.user_metadata?.avatar_url || '';

      // --------------------------------------------------------
      // FLOW 1: ADMIN LOGIN
      // --------------------------------------------------------
      if (oauthState === 'admin') {
        // Secure server-side check using check_admin_allowlist RPC
        const { data: allowlistData, error: rpcErr } = await supabase.rpc('check_admin_allowlist', {
          p_email: email
        });

        if (rpcErr) {
          console.error('RPC Error check_admin_allowlist:', rpcErr);
          setErrorMsg(`Database RPC check_admin_allowlist failed. Have you run the SQL migration script in your Supabase SQL Editor? Details: ${rpcErr.message}`);
          setStatus('error');
          return;
        }

        if (!allowlistData || !allowlistData.allowed) {
          // Immediately sign out unauthorized account
          await supabase.auth.signOut();
          setStatus('denied');
          return;
        }

        const assignedRole = allowlistData.role || 'admin';

        // Upsert admin profile
        await supabase.from('profiles').upsert({
          id: user.id,
          email,
          full_name: fullName,
          name: fullName,
          avatar_url: avatarUrl,
          role: assignedRole,
          status: 'active'
        }, { onConflict: 'id' });

        await checkSession();
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // --------------------------------------------------------
      // FLOW 2: SELLER LOGIN
      // --------------------------------------------------------
      if (oauthState === 'seller') {
        // Check if user is already an approved seller
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

        // Upsert profile as seller_pending
        await supabase.from('profiles').upsert({
          id: user.id,
          email,
          full_name: fullName,
          name: fullName,
          avatar_url: avatarUrl,
          role: 'seller_pending',
          status: 'pending'
        }, { onConflict: 'id' });

        // Create seller_requests record if it doesn't already exist
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
            applied_at: new Date().toISOString()
          });

          // Send confirmation email
          sendSellerApplicationReceivedEmail(email, fullName).catch(console.error);
        }

        await checkSession();
        navigate('/seller/application-pending', { replace: true });
        return;
      }

      // --------------------------------------------------------
      // FLOW 3: STUDENT LOGIN (default)
      // --------------------------------------------------------
      await supabase.from('profiles').upsert({
        id: user.id,
        email,
        full_name: fullName,
        name: fullName,
        avatar_url: avatarUrl,
        role: 'student',
        status: 'active'
      }, { onConflict: 'id' });

      await checkSession();
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      console.error('Auth callback error:', err);
      if (isMock) {
        await checkSession();
        if (oauthState === 'admin') {
          // Simulation allowlist check in mock mode: any email containing "admin" or test emails
          const email = 'admin@stethonotes.com';
          const isAllowed = email.toLowerCase().includes('admin');
          if (!isAllowed) {
            setStatus('denied');
            return;
          }
          navigate('/admin/dashboard', { replace: true });
        } else if (oauthState === 'seller') {
          navigate('/seller/application-pending', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        return;
      }
      setStatus('error');
      setErrorMsg(err.message || 'Authentication failed.');
    }
  };

  // ============================================================
  // ACCESS DENIED UI
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
          <h1 className="text-3xl font-display font-black text-red-500 tracking-tight mb-4">
            ACCESS DENIED
          </h1>
          <p className="text-slate-350 text-sm leading-relaxed mb-8">
            This Google account is not authorized to access the StethoNotes Admin Panel.
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
