import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { Landmark, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

interface WithdrawalRow {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  payout_method: string;
  payout_details: any;
  status: string;
  admin_notes: string | null;
  transaction_ref: string | null;
  created_at: string;
  paid_at: string | null;
  profiles?: { name: string; email: string };
}

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

export default function WithdrawalsManager() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('requested');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('withdrawal_requests')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRows((data || []) as WithdrawalRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const markPaid = async (row: WithdrawalRow) => {
    const ref = prompt('Transaction reference (UTR / UPI ref)? Required for record-keeping.');
    if (!ref) return;
    setBusyId(row.id);
    try {
      // Debit the wallet
      const { data: wallet } = await supabase.from('wallets').select('*').eq('id', row.wallet_id).single();
      if (!wallet) throw new Error('Wallet not found.');

      const newBalance = Number(wallet.available_balance) - Number(row.amount);
      const newDebit = Number(wallet.lifetime_debit) + Number(row.amount);

      await supabase
        .from('wallets')
        .update({ available_balance: newBalance, lifetime_debit: newDebit })
        .eq('id', wallet.id);

      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        user_id: row.user_id,
        type: 'withdrawal',
        amount: -Number(row.amount),
        balance_after: newBalance,
        reference_type: 'withdrawal_request',
        reference_id: row.id,
        description: `Withdrawal paid — ${row.payout_method.toUpperCase()} (Ref: ${ref})`,
      });

      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          transaction_ref: ref,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      addToast('success', 'Withdrawal Paid', `Seller wallet debited ₹${row.amount}.`);
      load();
    } catch (err: any) {
      addToast('error', 'Failed', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (row: WithdrawalRow) => {
    const notes = prompt('Reason for rejecting this withdrawal (visible to seller)?');
    if (!notes) return;
    try {
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          admin_notes: notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      addToast('info', 'Rejected', 'Marked as rejected.');
      load();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  const approve = async (row: WithdrawalRow) => {
    try {
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      addToast('success', 'Approved', 'Now process the payment externally and mark as paid.');
      load();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  return (
    <div className="p-6 lg:p-10" data-testid="withdrawals-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-emerald-500" />
            Seller Withdrawals
          </h1>
          <p className="text-xs text-slate-500 mt-1">Approve seller payout requests. After paying externally, mark as paid to debit the wallet.</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" data-testid="wd-refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'requested', 'approved', 'paid', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            data-testid={`wd-filter-${s}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3 font-semibold">Seller</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Payout Details</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Requested</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && !loading && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No withdrawals in this state.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50" data-testid={`wd-row-${r.id}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">{r.profiles?.name || '—'}</div>
                  <div className="text-slate-500 text-[11px]">{r.profiles?.email || '—'}</div>
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">₹{Number(r.amount).toFixed(2)}</td>
                <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">{r.payout_method}</td>
                <td className="px-4 py-3 text-[11px] text-slate-600 font-mono">
                  {r.payout_method === 'upi'
                    ? r.payout_details?.upi_id
                    : `${r.payout_details?.account_holder || ''} · ${r.payout_details?.account_number || ''} · ${r.payout_details?.ifsc || ''}`}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLES[r.status]}`}>
                    {r.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-[11px]">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === 'requested' && (
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => approve(r)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase"
                        data-testid={`wd-approve-${r.id}`}
                      >Approve</button>
                      <button
                        onClick={() => reject(r)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase"
                        data-testid={`wd-reject-${r.id}`}
                      >Reject</button>
                    </div>
                  )}
                  {r.status === 'approved' && (
                    <button
                      onClick={() => markPaid(r)}
                      disabled={busyId === r.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                      data-testid={`wd-paid-${r.id}`}
                    >
                      {busyId === r.id ? 'Processing…' : 'Mark Paid'}
                    </button>
                  )}
                  {r.transaction_ref && (
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{r.transaction_ref}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
