import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, X, RefreshCw, IndianRupee } from 'lucide-react';

interface WalletRow {
  id: string;
  available_balance: number;
  pending_balance: number;
  lifetime_credit: number;
  lifetime_debit: number;
}

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  balance_after: number | null;
  description: string;
  created_at: string;
}

interface WithdrawalRow {
  id: string;
  amount: number;
  payout_method: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  paid_at: string | null;
  transaction_ref: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

const MIN_WITHDRAWAL = 500;

export default function SellerWallet() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [wAmount, setWAmount] = useState('');
  const [wMethod, setWMethod] = useState<'upi' | 'bank'>('upi');
  const [wUpi, setWUpi] = useState('');
  const [wAcc, setWAcc] = useState('');
  const [wIfsc, setWIfsc] = useState('');
  const [wName, setWName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: w }, { data: t }, { data: wd }] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('withdrawal_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setWallet(w as WalletRow | null);
      setTxs((t || []) as WalletTx[]);
      setWithdrawals((wd || []) as WithdrawalRow[]);
    } catch (err: any) {
      addToast('error', 'Failed to load wallet', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const submitWithdrawal = async () => {
    if (!user?.id || !wallet) return;
    const amt = Number(wAmount);
    if (!amt || amt < MIN_WITHDRAWAL) {
      addToast('error', 'Amount too low', `Minimum withdrawal is ₹${MIN_WITHDRAWAL}`);
      return;
    }
    if (amt > wallet.available_balance) {
      addToast('error', 'Insufficient balance', `You only have ₹${wallet.available_balance} available.`);
      return;
    }
    if (wMethod === 'upi' && !wUpi.trim()) {
      addToast('error', 'UPI ID required', 'Please enter your UPI ID.');
      return;
    }
    if (wMethod === 'bank' && (!wAcc.trim() || !wIfsc.trim() || !wName.trim())) {
      addToast('error', 'Bank details required', 'Please fill account number, IFSC and account holder name.');
      return;
    }

    setSubmitting(true);
    try {
      const details = wMethod === 'upi'
        ? { upi_id: wUpi.trim() }
        : { account_number: wAcc.trim(), ifsc: wIfsc.trim().toUpperCase(), account_holder: wName.trim() };

      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        wallet_id: wallet.id,
        amount: amt,
        payout_method: wMethod,
        payout_details: details,
        status: 'requested',
      });
      if (error) throw error;

      addToast('success', 'Withdrawal Requested', 'Our team will process your request within 3-5 business days.');
      setShowWithdrawModal(false);
      setWAmount(''); setWUpi(''); setWAcc(''); setWIfsc(''); setWName('');
      load();
    } catch (err: any) {
      addToast('error', 'Request Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const available = Number(wallet?.available_balance || 0);
  const pending = Number(wallet?.pending_balance || 0);
  const lifetime = Number(wallet?.lifetime_credit || 0);

  return (
    <div data-testid="seller-wallet">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            Wallet
          </h2>
          <p className="text-xs text-slate-500 mt-1">Earnings from your sold notes. Withdraw once you cross ₹{MIN_WITHDRAWAL}.</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" data-testid="wallet-refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-lg shadow-emerald-500/20">
          <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Available Balance</div>
          <div className="mt-2 text-3xl font-extrabold flex items-center gap-1" data-testid="wallet-available-balance">
            <IndianRupee className="w-6 h-6" />{available.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={available < MIN_WITHDRAWAL}
            data-testid="wallet-withdraw-btn"
            className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Request Withdrawal
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Pending Clearance</div>
          <div className="mt-2 text-2xl font-bold text-slate-800 flex items-center gap-1">
            <IndianRupee className="w-5 h-5" />{pending.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 text-[11px] text-slate-500">Not yet withdrawable</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Lifetime Earnings</div>
          <div className="mt-2 text-2xl font-bold text-slate-800 flex items-center gap-1">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <IndianRupee className="w-5 h-5" />{lifetime.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {txs.length === 0 && !loading && (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">No transactions yet. Sales will appear here.</div>
          )}
          {txs.map(t => {
            const isCredit = Number(t.amount) >= 0;
            return (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50" data-testid={`tx-${t.id}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{t.description || t.type}</div>
                    <div className="text-[11px] text-slate-400">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className={`font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isCredit ? '+' : '−'}₹{Math.abs(Number(t.amount)).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Withdrawals */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Withdrawal Requests</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {withdrawals.length === 0 && !loading && (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">No withdrawal requests yet.</div>
          )}
          {withdrawals.map(w => (
            <div key={w.id} className="px-5 py-3 flex items-center justify-between" data-testid={`withdrawal-${w.id}`}>
              <div>
                <div className="text-sm font-semibold text-slate-800">₹{Number(w.amount).toFixed(2)} · <span className="uppercase text-[10px] text-slate-400">{w.payout_method}</span></div>
                <div className="text-[11px] text-slate-400">Requested {new Date(w.created_at).toLocaleDateString()}{w.paid_at ? ` · Paid ${new Date(w.paid_at).toLocaleDateString()}` : ''}</div>
                {w.transaction_ref && <div className="text-[11px] text-slate-500 mt-0.5">Ref: {w.transaction_ref}</div>}
                {w.admin_notes && <div className="text-[11px] text-slate-500 italic mt-0.5">Note: {w.admin_notes}</div>}
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLES[w.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                {w.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {w.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => !submitting && setShowWithdrawModal(false)}
          data-testid="withdraw-modal"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              disabled={submitting}
              data-testid="withdraw-close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-bold text-lg text-slate-800 mb-1">Request Withdrawal</h3>
            <p className="text-xs text-slate-500 mb-5">Available: <span className="font-bold text-emerald-600">₹{available.toFixed(2)}</span> · Minimum: ₹{MIN_WITHDRAWAL}</p>

            <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (INR)</label>
            <input
              type="number"
              value={wAmount}
              onChange={e => setWAmount(e.target.value)}
              placeholder="500"
              min={MIN_WITHDRAWAL}
              max={available}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              data-testid="withdraw-amount"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setWMethod('upi')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold ${wMethod === 'upi' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                data-testid="withdraw-method-upi"
              >UPI</button>
              <button
                onClick={() => setWMethod('bank')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold ${wMethod === 'bank' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                data-testid="withdraw-method-bank"
              >Bank Transfer</button>
            </div>

            {wMethod === 'upi' ? (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1">UPI ID</label>
                <input
                  value={wUpi}
                  onChange={e => setWUpi(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none"
                  data-testid="withdraw-upi-id"
                />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Account Holder Name</label>
                  <input value={wName} onChange={e => setWName(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none" data-testid="withdraw-acc-name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Account Number</label>
                  <input value={wAcc} onChange={e => setWAcc(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none" data-testid="withdraw-acc-number" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">IFSC Code</label>
                  <input value={wIfsc} onChange={e => setWIfsc(e.target.value.toUpperCase())} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm uppercase outline-none" data-testid="withdraw-ifsc" />
                </div>
              </div>
            )}

            <button
              onClick={submitWithdrawal}
              disabled={submitting}
              className="w-full mt-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
              data-testid="withdraw-submit"
            >
              {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              Requests are processed within 3-5 business days. KYC verification must be complete.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
