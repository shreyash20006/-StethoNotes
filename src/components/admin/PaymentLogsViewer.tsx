import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToastStore } from '../../store/useToastStore';
import { RefreshCw, CheckCircle2, XCircle, Zap, FileText, Webhook } from 'lucide-react';

type LogTab = 'payments' | 'webhooks' | 'emails';

interface PaymentLog {
  id: string;
  order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  stage: string;
  status: string;
  amount: number | null;
  method: string | null;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

interface WebhookLog {
  id: string;
  event_id: string | null;
  event_type: string;
  razorpay_payment_id: string | null;
  razorpay_refund_id: string | null;
  signature_valid: boolean;
  processing_status: string;
  order_id: string | null;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

interface EmailLog {
  id: string;
  order_id: string;
  email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function PaymentLogsViewer() {
  const { addToast } = useToastStore();
  const [tab, setTab] = useState<LogTab>('payments');
  const [loading, setLoading] = useState(false);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'payments') {
        const { data, error } = await supabase.from('payment_logs').select('*').order('created_at', { ascending: false }).limit(200);
        if (error) throw error;
        setPaymentLogs((data || []) as PaymentLog[]);
      } else if (tab === 'webhooks') {
        const { data, error } = await supabase.from('webhook_logs').select('*').order('received_at', { ascending: false }).limit(200);
        if (error) throw error;
        setWebhookLogs((data || []) as WebhookLog[]);
      } else {
        const { data, error } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(200);
        if (error) throw error;
        setEmailLogs((data || []) as EmailLog[]);
      }
    } catch (err: any) {
      addToast('error', 'Load Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const badge = (ok: boolean, textOk: string, textFail: string) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
      ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
    }`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {ok ? textOk : textFail}
    </span>
  );

  return (
    <div className="p-6 lg:p-10" data-testid="payment-logs-viewer">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-500" />
            Payment & Webhook Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">Complete audit trail of every payment attempt, webhook event, and email dispatch.</p>
        </div>
        <button
          onClick={load}
          data-testid="logs-refresh-btn"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-5">
        {([
          { id: 'payments', label: 'Payment Logs', icon: <Zap className="w-3.5 h-3.5" /> },
          { id: 'webhooks', label: 'Webhook Logs', icon: <Webhook className="w-3.5 h-3.5" /> },
          { id: 'emails', label: 'Email Logs', icon: <FileText className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-testid={`logs-tab-${t.id}`}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'payments' && (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3 font-semibold">Stage</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Payment ID</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentLogs.length === 0 && !loading && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No payment logs.</td></tr>
                )}
                {paymentLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-700">{l.stage}</td>
                    <td className="px-4 py-3">{badge(l.status === 'success', 'success', l.status)}</td>
                    <td className="px-4 py-3 font-bold">{l.amount ? `₹${Number(l.amount).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{l.razorpay_payment_id?.substring(0, 16) || '—'}</td>
                    <td className="px-4 py-3">{l.method || '—'}</td>
                    <td className="px-4 py-3 text-rose-600 text-[11px] max-w-xs truncate" title={l.error_message || ''}>{l.error_message || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-[10px]">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="text-cyan-600 hover:text-cyan-700 text-[10px] font-semibold uppercase"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'webhooks' && (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 font-semibold">Signature</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payment ID</th>
                  <th className="px-4 py-3 font-semibold">Refund ID</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                  <th className="px-4 py-3 font-semibold">Received</th>
                  <th className="px-4 py-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {webhookLogs.length === 0 && !loading && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No webhook events.</td></tr>
                )}
                {webhookLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-700">{l.event_type}</td>
                    <td className="px-4 py-3">{badge(l.signature_valid, 'valid', 'invalid')}</td>
                    <td className="px-4 py-3">{badge(l.processing_status === 'processed' || l.processing_status === 'duplicate', l.processing_status, l.processing_status)}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{l.razorpay_payment_id?.substring(0, 16) || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{l.razorpay_refund_id?.substring(0, 16) || '—'}</td>
                    <td className="px-4 py-3 text-rose-600 text-[11px] max-w-xs truncate" title={l.error_message || ''}>{l.error_message || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-[10px]">{new Date(l.received_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="text-cyan-600 hover:text-cyan-700 text-[10px] font-semibold uppercase"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'emails' && (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No email logs.</td></tr>
                )}
                {emailLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">{l.email}</td>
                    <td className="px-4 py-3">{badge(l.status === 'success', 'sent', l.status)}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{l.order_id?.substring(0, 8) || '—'}...</td>
                    <td className="px-4 py-3 text-rose-600 text-[11px] max-w-xs truncate" title={l.error_message || ''}>{l.error_message || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-[10px]">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setSelectedLog(null)}
          data-testid="log-details-modal"
        >
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <pre className="text-[10px] bg-slate-50 rounded-xl p-4 overflow-auto font-mono text-slate-700">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
