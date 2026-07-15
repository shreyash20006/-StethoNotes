import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Undo2 } from 'lucide-react';

interface RefundRow {
  id: string;
  order_id: string;
  user_id: string | null;
  razorpay_payment_id: string;
  razorpay_refund_id: string | null;
  amount: number;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  orders?: { customer_name: string; customer_email: string; total_amount: number };
}

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  processed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

export default function RefundsManager() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('refunds')
        .select('*, orders(customer_name, customer_email, total_amount)')
        .order('created_at', { ascending: false });
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      setRefunds((data || []) as RefundRow[]);
    } catch (err: any) {
      addToast('error', 'Load Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const processRefund = async (row: RefundRow) => {
    if (!confirm(`Process refund of ₹${row.amount} for order ${row.order_id.substring(0, 8)}...? This calls Razorpay refund API and is irreversible.`)) return;
    setProcessingId(row.id);
    try {
      const { data, error } = await supabase.functions.invoke('razorpay', {
        headers: { 'x-action': 'create-refund' },
        body: { action: 'create-refund', refund_id: row.id, admin_user_id: user?.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Refund failed');
      addToast('success', 'Refund Initiated', `Razorpay refund ID: ${data.razorpay_refund_id}`);
      load();
    } catch (err: any) {
      addToast('error', 'Refund Failed', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRefund = async (row: RefundRow) => {
    const notes = prompt('Reason for rejecting this refund? (visible to admin only)');
    if (!notes) return;
    try {
      const { error } = await supabase
        .from('refunds')
        .update({ status: 'rejected', admin_notes: notes, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', row.id);
      if (error) throw error;
      await supabase.from('orders').update({ refund_status: 'rejected' }).eq('id', row.order_id);
      addToast('info', 'Refund Rejected', 'Marked as rejected.');
      load();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  const counts = {
    all: refunds.length,
    requested: refunds.filter(r => r.status === 'requested').length,
    processed: refunds.filter(r => r.status === 'processed').length,
    failed: refunds.filter(r => r.status === 'failed').length,
  };

  return (
    <div className="p-6 lg:p-10" data-testid="refunds-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 flex items-center gap-2.5">
            <Undo2 className="w-6 h-6 text-red-500" />
            Refund Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review student refund requests and process via Razorpay.</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
          data-testid="refunds-refresh-btn"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'requested', 'processing', 'processed', 'rejected', 'failed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            data-testid={`refund-filter-${s}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterStatus === s
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s in counts && ` (${(counts as any)[s]})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Requested</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refunds.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No refund requests found.</td></tr>
              )}
              {refunds.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50" data-testid={`refund-row-${r.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{r.orders?.customer_name || '—'}</div>
                    <div className="text-slate-500 text-[11px]">{r.orders?.customer_email || '—'}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{r.order_id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 font-bold text-slate-900">₹{Number(r.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLES[r.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {r.status === 'processed' && <CheckCircle2 className="w-3 h-3" />}
                      {r.status === 'failed' && <XCircle className="w-3 h-3" />}
                      {(r.status === 'requested' || r.status === 'processing') && <Clock className="w-3 h-3" />}
                      {r.status === 'rejected' && <AlertTriangle className="w-3 h-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'requested' && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => processRefund(r)}
                          disabled={processingId === r.id}
                          data-testid={`refund-approve-${r.id}`}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                        >
                          {processingId === r.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => rejectRefund(r)}
                          data-testid={`refund-reject-${r.id}`}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                    {r.razorpay_refund_id && (
                      <div className="text-[10px] text-slate-400 font-mono">{r.razorpay_refund_id.substring(0, 14)}...</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
