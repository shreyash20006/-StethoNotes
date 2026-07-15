import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { ShieldCheck, Upload, FileText, CheckCircle2, Clock, XCircle, Trash2 } from 'lucide-react';

interface SellerDoc {
  id: string;
  doc_type: string;
  file_url: string;
  file_name: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const DOC_TYPES: { id: string; label: string; description: string }[] = [
  { id: 'college_id', label: 'College / University ID', description: 'Current student or faculty ID card' },
  { id: 'govt_id', label: 'Government ID', description: 'Aadhaar, Passport, Voter ID or Driving Licence' },
  { id: 'pan', label: 'PAN Card', description: 'Required for payouts above ₹15,000/year' },
  { id: 'bank_proof', label: 'Bank / UPI Proof', description: 'Cancelled cheque, bank statement, or UPI screenshot' },
];

const STATUS_STYLES: Record<string, { cls: string; icon: any }> = {
  pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected: { cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

export default function SellerKYC() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [docs, setDocs] = useState<SellerDoc[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('seller_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setDocs((data || []) as SellerDoc[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleFile = async (docType: string, file: File) => {
    if (!user?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'File too large', 'Maximum size is 5 MB.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      addToast('error', 'Unsupported format', 'Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }
    setUploadingType(docType);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${docType}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('seller-documents')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from('seller_documents').insert({
        user_id: user.id,
        doc_type: docType,
        file_url: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
      });
      if (dbErr) throw dbErr;

      addToast('success', 'Document Uploaded', 'Our team will verify it within 3-5 business days.');
      load();
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message);
    } finally {
      setUploadingType(null);
    }
  };

  const deleteDoc = async (doc: SellerDoc) => {
    if (!confirm('Delete this document? You will need to re-upload it for verification.')) return;
    try {
      await supabase.storage.from('seller-documents').remove([doc.file_url]);
      await supabase.from('seller_documents').delete().eq('id', doc.id);
      addToast('info', 'Deleted', 'Document removed.');
      load();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  const getLatest = (type: string): SellerDoc | undefined =>
    docs.find(d => d.doc_type === type);

  const allApproved = DOC_TYPES.every(t => getLatest(t.id)?.status === 'approved');
  const anyRejected = docs.some(d => d.status === 'rejected');

  return (
    <div data-testid="seller-kyc">
      <div className="mb-6 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">KYC Verification</h2>
          <p className="text-xs text-slate-500 mt-1">Complete verification to unlock withdrawals and receive payouts.</p>
        </div>
      </div>

      {/* Status banner */}
      {allApproved ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-center gap-3" data-testid="kyc-status-banner">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div className="text-sm text-emerald-800 font-semibold">KYC Verified — you are eligible for payouts.</div>
        </div>
      ) : anyRejected ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-center gap-3" data-testid="kyc-status-banner">
          <XCircle className="w-5 h-5 text-rose-600" />
          <div className="text-sm text-rose-800 font-semibold">One or more documents were rejected. Please re-upload.</div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3" data-testid="kyc-status-banner">
          <Clock className="w-5 h-5 text-amber-600" />
          <div className="text-sm text-amber-800 font-semibold">Verification pending. Upload all documents below.</div>
        </div>
      )}

      {/* Document cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOC_TYPES.map(t => {
          const latest = getLatest(t.id);
          const StatusIcon = latest ? STATUS_STYLES[latest.status]?.icon : null;
          return (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5" data-testid={`kyc-card-${t.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{t.label}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
                </div>
                {latest && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLES[latest.status]?.cls || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {StatusIcon && <StatusIcon className="w-3 h-3" />}
                    {latest.status}
                  </span>
                )}
              </div>

              {latest ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate">{latest.file_name || 'document'}</div>
                      <div className="text-[10px] text-slate-400">{new Date(latest.created_at).toLocaleDateString()}</div>
                    </div>
                    {latest.status !== 'approved' && (
                      <button
                        onClick={() => deleteDoc(latest)}
                        className="text-slate-400 hover:text-rose-600"
                        data-testid={`kyc-delete-${t.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {latest.admin_notes && (
                    <p className="text-[11px] italic text-slate-500 mt-2">Note: {latest.admin_notes}</p>
                  )}
                  {latest.status !== 'approved' && (
                    <label className="mt-3 block cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={e => e.target.files?.[0] && handleFile(t.id, e.target.files[0])}
                        data-testid={`kyc-reupload-input-${t.id}`}
                      />
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold">
                        <Upload className="w-3.5 h-3.5" />
                        Re-upload
                      </span>
                    </label>
                  )}
                </div>
              ) : (
                <label className="mt-2 block cursor-pointer" data-testid={`kyc-upload-label-${t.id}`}>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={e => e.target.files?.[0] && handleFile(t.id, e.target.files[0])}
                    disabled={uploadingType === t.id}
                    data-testid={`kyc-upload-input-${t.id}`}
                  />
                  <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-6 text-center transition-colors">
                    <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                    <div className="text-xs font-semibold text-slate-700">
                      {uploadingType === t.id ? 'Uploading…' : 'Click to upload'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP, or PDF · Max 5 MB</div>
                  </div>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {loading && docs.length === 0 && (
        <p className="text-center text-slate-400 text-sm mt-6">Loading your documents…</p>
      )}
    </div>
  );
}
