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

  // Extract intended role flow from URL query, hash verifier, or localStorage fallback
  const rawRole = searchParams.get('role') || searchParams.get('flow');
  const rawState = searchParams.get('state');
  const savedRole = localStorage.getItem('stetho_pending_oauth_role') as 'student' | 'seller' | 'admin' | null;

  // Suppress long PKCE verifier state parameter strings in live mode
  const isMockState = rawState && rawState.length < 15;
  const oauthState = rawRole || (isMockState ? rawState : null) || savedRole || 'student';
  const isMock = searchParams.get('mock') === 'true' || !isLiveSupabase;

  useEffect(() => {
    console.log('[DEBUG] AuthCallbackPage mounted. Context:', {
      urlSearch: window.location.search,
      urlHash: window.location.hash,
      rawRole,
      rawState,
      savedRole,
      oauthState,
      isMock,
      isLiveSupabase
    });
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 1. Fetch current session (client-side SDK might have already exchanged code automatically)
      let { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error('[DEBUG] Fetch session error:', sessionErr);
        throw sessionErr;
      }

      // 2. If no session exists yet, try exchanging code manually
      if (!session && isLiveSupabase) {
        const code = searchParams.get('code');
        if (code) {
          try {
            console.log('[DEBUG] Session not found. Exchanging code manually:', code);
            const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeErr) {
              console.warn('[DEBUG] Code exchange returned error (might be already consumed):', exchangeErr);
            } else {
              const { data: refreshed } = await supabase.auth.getSession();
              session = refreshed.session;
            }
          } catch (e) {
            console.warn('[DEBUG] Exception during code exchange:', e);
          }
        }
      }

      // 3. Re-fetch session one last time
      if (!session) {
        const { data: refreshed } = await supabase.auth.getSession();
        session = refreshed.session;
      }

      if (!session?.user) {
        console.error('[DEBUG] Authentication callback failed to retrieve a valid user session.');
        throw new Error('No session after OAuth callback. If you are in mock mode, please ensure your browser has localStorage enabled.');
      }

      const user = session.user;
      const email = user.email || '';
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
      const avatarUrl = user.user_metadata?.avatar_url || '';

      console.log('[DEBUG] OAuth Session User Retrieved:', {
        userId: user.id,
        email,
        fullName,
        avatarUrl
      });

      // 4. Fetch existing database profile
      const { data: existingProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileErr && profileErr.code !== 'PGRST116') {
        console.warn('[DEBUG] Profile query encountered error:', profileErr);
      }

      console.log('[DEBUG] Existing profile status:', existingProfile);

      let finalRole = existingProfile?.role;
      let finalStatus = existingProfile?.status || 'active';

      // 5. Resolve role & status depending on flow and allowlist
      if (oauthState === 'admin') {
        console.log('[DEBUG] Admin login flow. Checking backend allowlist for:', email);
        
        // Secure backend check using check_admin_allowlist RPC
        const { data: allowlistData, error: rpcErr } = await supabase.rpc('check_admin_allowlist', {
          p_email: email
        });

        console.log('[DEBUG] Allowlist RPC response:', { allowlistData, rpcErr });

        if (rpcErr) {
          console.error('[DEBUG] Allowlist RPC failed:', rpcErr);
          setErrorMsg(`Database RPC check_admin_allowlist failed. Have you run the SQL migration script in your Supabase SQL Editor? Details: ${rpcErr.message}`);
          setStatus('error');
          return;
        }

        if (!allowlistData || !allowlistData.allowed) {
          console.warn('[DEBUG] Admin access denied for:', email);
          await supabase.auth.signOut();
          setStatus('denied');
          return;
        }

        finalRole = allowlistData.role || 'admin';
        finalStatus = 'active';

      } else if (oauthState === 'seller') {
        console.log('[DEBUG] Seller login/signup flow triggered for:', email);
        
        // Transition students to pending sellers; keep existing approved/rejected sellers intact
        if (finalRole !== 'seller' && finalRole !== 'seller_pending') {
          finalRole = 'seller_pending';
          finalStatus = 'pending';
        }

      } else {
        console.log('[DEBUG] Student login/signup flow triggered for:', email);
        
        // Default to student if no role is established yet
        if (!finalRole) {
          finalRole = 'student';
          finalStatus = 'active';
        }
      }

      // 6. Upsert the profile table (preventing duplicate key collisions)
      const profilePayload = {
        id: user.id,
        email,
        full_name: fullName,
        name: fullName,
        avatar_url: avatarUrl,
        role: finalRole,
        status: finalStatus,
        updated_at: new Date().toISOString()
      };

      console.log('[DEBUG] Upserting profile record:', profilePayload);
      const { error: upsertErr } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      
      if (upsertErr) {
        console.error('[DEBUG] Profile upsert failed:', upsertErr);
        throw upsertErr;
      }

      // 7. Handle Seller request log entry
      if (finalRole === 'seller_pending') {
        const { data: existingReq } = await supabase
          .from('seller_requests')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!existingReq) {
          console.log('[DEBUG] Inserting new seller request record for:', email);
          await supabase.from('seller_requests').insert({
            user_id: user.id,
            email,
            full_name: fullName,
            status: 'pending',
            applied_at: new Date().toISOString()
          });

          // Send Brevo application email
          sendSellerApplicationReceivedEmail(email, fullName).catch(console.error);
        }
      }

      // 8. Update client auth store state
      await checkSession();

      // Clear pending oauth role flag from local storage
      localStorage.removeItem('stetho_pending_oauth_role');

      // 9. Redirect user to their corresponding role dashboard
      let redirectDest = '/dashboard';
      if (finalRole === 'admin' || finalRole === 'super_admin') {
        redirectDest = '/admin/dashboard';
      } else if (finalRole === 'seller') {
        redirectDest = '/seller/dashboard';
      } else if (finalRole === 'seller_pending') {
        redirectDest = '/seller/application-pending';
      }

      console.log('[DEBUG] Auth flow successful. Redirecting to:', redirectDest);
      navigate(redirectDest, { replace: true });

    } catch (err: any) {
      console.error('[DEBUG] Authentication flow caught exception:', err);
      
      if (isMock) {
        console.log('[DEBUG] Handling mock callback fallback logic...');
        await checkSession();
        localStorage.removeItem('stetho_pending_oauth_role');

        let redirectDest = '/dashboard';
        if (oauthState === 'admin') {
          // Simulation mock allowlist (allows emails containing 'admin')
          const mockEmail = 'admin@stethonotes.com';
          const isAllowed = mockEmail.toLowerCase().includes('admin');
          if (!isAllowed) {
            setStatus('denied');
            return;
          }
          redirectDest = '/admin/dashboard';
        } else if (oauthState === 'seller') {
          redirectDest = '/seller/application-pending';
        }

        console.log('[DEBUG] Mock redirection target:', redirectDest);
        navigate(redirectDest, { replace: true });
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
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-6 font-semibold">{errorMsg}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Go back to homepage
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
        <p className="text-slate-400 text-sm font-display">Verifying your account…</p>
      </motion.div>
    </div>
  );
}
