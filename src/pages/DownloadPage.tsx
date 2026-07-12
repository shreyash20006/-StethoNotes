import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Download, FileText, Calendar, ShieldCheck, Loader2 } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

export default function DownloadPage() {
  const { orderId, noteId } = useParams<{ orderId: string; noteId: string }>();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noteInfo, setNoteInfo] = useState<{ title: string; subject: string; courseName: string } | null>(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  useEffect(() => {
    verifyAccess();
  }, [orderId, noteId]);

  const verifyAccess = async () => {
    if (!orderId || !noteId) {
      setErrorMsg('Invalid download link parameters.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Fetch order and confirm completed payment status
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('id, created_at, payment_status, customer_email, customer_name')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) {
        setErrorMsg('Order records not found. Please verify your order ID.');
        return;
      }

      if (order.payment_status !== 'completed') {
        setErrorMsg('Payment verification is incomplete. Please settle payment or contact support.');
        return;
      }

      // 2. Check Expiration (48 hours)
      const purchaseTime = new Date(order.created_at).getTime();
      const expirationTime = purchaseTime + 48 * 60 * 60 * 1000;
      const now = Date.now();

      setPurchaseDate(new Date(order.created_at).toLocaleString());
      setExpiryDate(new Date(expirationTime).toLocaleString());

      if (now > expirationTime) {
        setErrorMsg('This download link has expired (48-hour limit exceeded). Please contact StethoNotes support.');
        return;
      }

      // 3. Check Download Count (Max 3)
      const { count, error: countErr } = await supabase
        .from('download_history')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', orderId)
        .eq('note_id', noteId);

      if (countErr) {
        console.error('Error fetching download logs:', countErr);
      }
      
      const currentDownloads = count || 0;
      setDownloadCount(currentDownloads);

      if (currentDownloads >= 3) {
        setErrorMsg('You have reached the maximum download limit of 3 times. Access blocked.');
        return;
      }

      // 4. Fetch Note details
      const { data: note, error: noteErr } = await supabase
        .from('notes')
        .select('title, subject, courses(name)')
        .eq('id', noteId)
        .single();

      if (noteErr || !note) {
        setErrorMsg('The requested study notes could not be retrieved from the catalog.');
        return;
      }

      setNoteInfo({
        title: note.title,
        subject: note.subject,
        courseName: (note as any).courses?.name || 'Medical'
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!orderId || !noteId) return;
    setDownloading(true);
    try {
      addToast('info', 'Compiling Note', 'Generating your personalized watermarked copy...');

      // Call the Edge Function to watermark and download
      const { data, error } = await supabase.functions.invoke('download-notes', {
        body: { orderId, noteId }
      });

      if (error || !data?.signedUrl) {
        throw new Error(data?.error || error?.message || 'Fulfillment function failed to generate note.');
      }

      // Increment local count
      setDownloadCount(prev => prev + 1);

      // Trigger actual download via window.open/anchor
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.target = '_blank';
      link.download = `${noteInfo?.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_watermarked.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast('success', 'Download Started', 'Personalized PDF note downloaded successfully.');
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Fulfillment Error', err.message || 'Could not compile and download notes.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-display p-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm max-w-md w-full flex flex-col items-center text-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
          <h3 className="text-base font-bold text-slate-800">Verifying Delivery Credentials</h3>
          <p className="text-xs text-slate-400">Verifying order signatures, payment status, and download thresholds...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-display p-6">
        <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-md max-w-md w-full flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Download Link Blocked</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
          </div>
          <div className="w-full pt-4 border-t border-slate-100 flex flex-col gap-3">
            <a 
              href="mailto:support@stethonotes.com"
              className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-200 block"
            >
              Contact Support
            </a>
            <Link 
              to="/courses"
              className="py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors block"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-display p-6">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-lg max-w-md w-full flex flex-col gap-6 text-left">
        {/* Header */}
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center">
            <FileText className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Secure File Delivery</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Order Verified</p>
          </div>
        </div>

        {/* Note Info */}
        {noteInfo && (
          <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {noteInfo.courseName} — {noteInfo.subject}
            </span>
            <h4 className="text-sm font-bold text-slate-800 leading-snug">{noteInfo.title}</h4>
          </div>
        )}

        {/* Protection Policies */}
        <div className="space-y-3.5 text-xs text-slate-600">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 block">Personalized Watermarking</span>
              <span className="text-[11px] text-slate-450 block mt-0.5">
                Every page of this notes PDF is dynamically watermarked with your account billing credentials to prevent illegal distributions.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 block">Expiration & Counters</span>
              <div className="text-[11px] text-slate-450 space-y-1 mt-0.5">
                <p>• Placed: <span className="font-medium text-slate-700">{purchaseDate}</span></p>
                <p>• Expires: <span className="font-medium text-slate-700">{expiryDate}</span></p>
                <p>• Downloads Count: <span className="font-bold text-[#0c1230]">{downloadCount} / 3 maximum</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Trigger */}
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-100 flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling Secure Copy...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Secure PDF</span>
              </>
            )}
          </button>
          
          <Link 
            to="/courses"
            className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 text-center rounded-xl text-xs font-bold transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
