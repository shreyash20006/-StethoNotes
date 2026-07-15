import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Gift, Copy, Share2, Trophy, IndianRupee } from 'lucide-react';

interface ReferralStat {
  code: string;
  totalReferred: number;
  totalRewarded: number;
  totalEarnings: number;
  walletBalance: number;
}

export default function ReferralCard() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [stat, setStat] = useState<ReferralStat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [{ data: profile }, { data: refs }, { data: wallet }] = await Promise.all([
          supabase.from('profiles').select('referral_code, name').eq('id', user.id).single(),
          supabase.from('referrals').select('status, reward_amount').eq('referrer_id', user.id),
          supabase.from('wallets').select('available_balance').eq('user_id', user.id).maybeSingle(),
        ]);

        let code = profile?.referral_code;
        if (!code) {
          // Generate a client-side fallback code if migration backfill didn't run
          const base = (profile?.name || 'STETH').replace(/[^A-Za-z]/g, '').toUpperCase().substring(0, 5) || 'STETH';
          code = `${base}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
          await supabase.from('profiles').update({ referral_code: code }).eq('id', user.id);
        }

        const rewarded = (refs || []).filter((r: any) => r.status === 'rewarded');
        setStat({
          code,
          totalReferred: (refs || []).length,
          totalRewarded: rewarded.length,
          totalEarnings: rewarded.reduce((s: number, r: any) => s + Number(r.reward_amount || 0), 0),
          walletBalance: Number(wallet?.available_balance || 0),
        });
      } catch (err: any) {
        console.error('Referral load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const shareLink = stat ? `https://stethonotes.store/login?signup=true&ref=${stat.code}` : '';

  const copyCode = async () => {
    if (!stat) return;
    await navigator.clipboard.writeText(stat.code);
    addToast('success', 'Copied!', `Code ${stat.code} copied to clipboard.`);
  };

  const shareUrl = async () => {
    if (!stat) return;
    await navigator.clipboard.writeText(shareLink);
    addToast('success', 'Link Copied!', 'Share this with your friends.');
  };

  const nativeShare = async () => {
    if (!stat || !navigator.share) return shareUrl();
    try {
      await navigator.share({
        title: 'StethoNotes — Medical Study Notes',
        text: `Get quality medical study notes! Use my code ${stat.code} to sign up.`,
        url: shareLink,
      });
    } catch (_) { /* user cancelled */ }
  };

  if (loading) return null;
  if (!stat) return null;

  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-3xl p-6 shadow-lg shadow-primary/20 relative overflow-hidden" data-testid="referral-card">
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4 relative">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            <h3 className="font-display font-bold text-lg">Refer & Earn</h3>
          </div>
          <p className="text-xs text-white/70 mt-1">Earn ₹50 wallet credit for each friend who signs up and purchases their first note (min ₹199).</p>
        </div>
        <Trophy className="w-5 h-5 text-accent/50" />
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4 relative">
        <div className="text-[10px] uppercase tracking-wider text-white/60 font-semibold mb-1">Your Referral Code</div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-2xl font-extrabold tracking-widest" data-testid="referral-code">{stat.code}</div>
          <button
            onClick={copyCode}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            data-testid="referral-copy-code"
            aria-label="Copy code"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 relative">
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <div className="text-lg font-extrabold" data-testid="referral-signups">{stat.totalReferred}</div>
          <div className="text-[10px] uppercase text-white/60 font-semibold">Signups</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <div className="text-lg font-extrabold" data-testid="referral-rewarded">{stat.totalRewarded}</div>
          <div className="text-[10px] uppercase text-white/60 font-semibold">Rewarded</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <div className="text-lg font-extrabold flex items-center justify-center" data-testid="referral-earnings"><IndianRupee className="w-4 h-4" />{stat.totalEarnings}</div>
          <div className="text-[10px] uppercase text-white/60 font-semibold">Earned</div>
        </div>
      </div>

      <div className="flex gap-2 relative">
        <button
          onClick={shareUrl}
          className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          data-testid="referral-copy-link"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy Link
        </button>
        <button
          onClick={nativeShare}
          className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          data-testid="referral-share-btn"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>
    </div>
  );
}
