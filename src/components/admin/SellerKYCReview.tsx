import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, ExternalLink, Clock } from 'lucide-react';

interface SellerDocRow {
  id: string;
  user_id: string;
  doc_type: string;
  file_url: string;
  file_name: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profiles?: { name: string; email: string };
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function SellerKYCReview() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [docs, setDocs] = useState<SellerDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('seller_documents')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setDocs((data || []) as SellerDocRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const viewDoc = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('seller-documents')
      .createSignedUrl(path, 600);
    if (error || !data?.signedUrl) {
      addToast('error', 'Preview Failed', error?.message || 'Could not open document.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const review = async (row: SellerDocRow, decision: 'approved' | 'rejected') => {
    let notes: string | null = null;
    if (decision === 'rejected') {
      notes = prompt('Reason for rejecting this document (visible to seller)?');
      if (!notes) return;
    }
    try {
      await supabase
        .from('seller_documents')
        .update({
          status: decision,
          admin_notes: notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      addToast('success', 'Reviewed', `Marked as ${decision}.`);
      load();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  return (
    <div className="p-6 lg:p-10" data-testid="seller-kyc-review">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Seller KYC Review
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review and approve seller identity documents.</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" data-testid="kyc-review-refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            data-testid={`kyc-filter-${s}`}
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
              <th className="px-4 py-3 font-semibold">Document Type</th>
              <th className="px-4 py-3 font-semibold">File</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Uploaded</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No documents in this state.</td></tr>
            )}
            {docs.map(d => (
              <tr key={d.id} className="hover:bg-slate-50/50" data-testid={`kyc-row-${d.id}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">{d.profiles?.name || '—'}</div>
                  <div className="text-slate-500 text-[11px]">{d.profiles?.email || '—'}</div>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-700">{d.doc_type}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => viewDoc(d.file_url)}
                    className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-semibold"
                    data-testid={`kyc-view-${d.id}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {(d.file_name || 'document').substring(0, 24)}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLES[d.status]}`}>
                    {d.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : d.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-[11px]">{new Date(d.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {d.status === 'pending' ? (
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => review(d, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase"
                        data-testid={`kyc-approve-${d.id}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => review(d, 'rejected')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase"
                        data-testid={`kyc-reject-${d.id}`}
                      >
                        Reject
                      </button>
                    </div>
                  ) : d.admin_notes ? (
                    <span className="text-[10px] italic text-slate-500">{d.admin_notes.substring(0, 30)}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
