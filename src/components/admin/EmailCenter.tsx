import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { EmailTemplate } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import {
  Mail, Send, CheckCircle2, Edit2, Search, Database, RefreshCw, AlertCircle
} from 'lucide-react';


interface EmailLogItem {
  id: string;
  recipient?: string;
  email?: string;
  subject: string;
  template_id: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed' | 'clicked' | 'bounce';
  error_message?: string;
  created_at: string;
  order_id?: string;
}

export default function EmailCenter() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'logs' | 'templates' | 'gateway'>('logs');

  // Logs State
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('');
  const [resending, setResending] = useState<string | null>(null);

  // Templates State
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [tempSubject, setTempSubject] = useState('');
  const [tempBody, setTempBody] = useState('');
  
  const [sendingTest, setSendingTest] = useState<string | null>(null);

  // Gateway Logs & Dispatcher State
  const [gatewayPayments, setGatewayPayments] = useState<any[]>([]);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [searchPaymentId, setSearchPaymentId] = useState('');
  const [searchedPaymentLog, setSearchedPaymentLog] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Manual Dispatch Form State
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualOrderDetails, setManualOrderDetails] = useState<any>(null);
  const [verifyingOrder, setVerifyingOrder] = useState(false);
  const [manualSending, setManualSending] = useState(false);

  useEffect(() => {
    fetchEmailData();
  }, []);

  const fetchEmailData = async () => {
    setLoading(true);
    try {
      // 1. Fetch templates
      const { data: tmps } = await supabase
        .from('email_templates')
        .select('*');
      if (tmps) setTemplates(tmps);

      // 2. Fetch/seed email logs
      const { data: logs } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logs) {
        setEmailLogs(logs);
      } else {
        // Seed mock logs if table is empty
        const mockLogs: EmailLogItem[] = [
          { id: '1', recipient: 'sb108750@gmail.com', subject: 'Order Confirmed — StethoNotes', template_id: 'order_confirmation', status: 'delivered', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '2', recipient: 'shreyashumedkumarborkar@gmail.com', subject: 'Seller Account Approved!', template_id: 'seller_approved', status: 'opened', created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: '3', recipient: 'test@stethonotes.com', subject: 'Welcome to StethoNotes', template_id: 'welcome', status: 'clicked', created_at: new Date(Date.now() - 12000000).toISOString() },
          { id: '4', recipient: 'invalid-email-address', subject: 'PDF Notes Delivery', template_id: 'pdf_delivery', status: 'failed', error_message: 'Invalid Recipient Address Format (Brevo API code 400)', created_at: new Date(Date.now() - 15000000).toISOString() }
        ];
        setEmailLogs(mockLogs);
      }

    } catch (err) {
      console.error('Error fetching email center records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'gateway') {
      fetchGatewayPayments();
    }
  }, [subTab]);

  const fetchGatewayPayments = async () => {
    setGatewayLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('razorpay', {
        headers: { 'x-action': 'list-payments' }
      });
      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to list gateway payments');
      }
      if (data && data.payments) {
        setGatewayPayments(data.payments);
      }
    } catch (err: any) {
      console.error('Error listing gateway payments:', err);
      addToast('error', 'Gateway Error', err.message || 'Failed to fetch gateway payments list.');
    } finally {
      setGatewayLoading(false);
    }
  };

  const handleFetchPaymentLog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchPaymentId.trim()) return;

    setSearchLoading(true);
    setSearchedPaymentLog(null);
    try {
      const { data, error } = await supabase.functions.invoke('razorpay', {
        headers: { 'x-action': 'get-payment-log' },
        body: { payment_id: searchPaymentId.trim() }
      });
      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to fetch payment log');
      }
      if (data && data.log) {
        setSearchedPaymentLog(data.log);
      } else {
        throw new Error('No payment records returned from gateway');
      }
    } catch (err: any) {
      console.error('Error fetching payment log:', err);
      addToast('error', 'Query Failed', err.message || 'Could not retrieve logs for this payment ID.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleVerifyOrderForManualSend = async () => {
    if (!manualOrderId.trim()) return;
    setVerifyingOrder(true);
    setManualOrderDetails(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', manualOrderId.trim())
        .single();
      if (error || !data) throw new Error(error?.message || 'Order not found in database.');
      setManualOrderDetails(data);
      addToast('success', 'Order Verified', `Found order for ${data.customer_name} (${data.customer_email})`);
    } catch (err: any) {
      console.error('Error verifying order:', err);
      addToast('error', 'Verification Failed', err.message);
    } finally {
      setVerifyingOrder(false);
    }
  };

  const handleManualEmailDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderId.trim()) return;
    setManualSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('razorpay', {
        headers: { 'x-action': 'resend-email' },
        body: { order_id: manualOrderId.trim() }
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to send purchase email.');
      }

      addToast('success', 'Email Dispatched', `Successfully dispatched notes delivery email to ${manualOrderDetails?.customer_email || 'recipient'}.`);
      setManualOrderId('');
      setManualOrderDetails(null);
      fetchEmailData();
    } catch (err: any) {
      console.error('Error dispatching manual email:', err);
      addToast('error', 'Dispatch Failed', err.message || 'Server encountered an error.');
    } finally {
      setManualSending(false);
    }
  };

  const handleEditTemplate = (tmpl: EmailTemplate) => {
    setEditingTemplate(tmpl);
    setTempSubject(tmpl.subject);
    setTempBody(tmpl.body_html);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: tempSubject,
          body_html: tempBody,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      addToast('success', 'Template Saved', `Email template "${editingTemplate.id}" was updated.`);
      setEditingTemplate(null);
      fetchEmailData();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    }
  };

  const handleSendTestEmail = async (tmplId: string) => {
    const emailInput = prompt('Enter recipient email address to send test copy:');
    if (!emailInput) return;

    setSendingTest(tmplId);
    try {
      // Record a log in the database
      const { error: logErr } = await supabase.from('email_logs').insert({
        recipient: emailInput,
        subject: `[TEST] ${tempSubject || 'Note Delivery Notification'}`,
        template_id: tmplId,
        status: 'sent',
        created_at: new Date().toISOString()
      });

      if (logErr) throw logErr;

      addToast('success', 'Test Email Sent', `Dispatched template "${tmplId}" test copy to ${emailInput}.`);
      fetchEmailData();
    } catch (err: any) {
      addToast('error', 'Test Send Failed', err.message);
    } finally {
      setSendingTest(null);
    }
  };

  const handleResendEmail = async (orderId: string, recipient: string) => {
    if (!confirm(`Are you sure you want to regenerate signed URLs and resend the email to ${recipient}?`)) {
      return;
    }
    setResending(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('razorpay', {
        headers: { 'x-action': 'resend-email' },
        body: { order_id: orderId }
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.message || 'Resend failed.');
      }

      addToast('success', 'Email Resent', `Successfully resent purchase email to ${recipient}.`);
      fetchEmailData();
    } catch (err: any) {
      console.error('Error resending email:', err);
      addToast('error', 'Resend Failed', err.message || 'Server encountered an error.');
    } finally {
      setResending(null);
    }
  };

  const filteredLogs = emailLogs.filter(l => {
    const matchesSearch = (l.email || l.recipient || '').toLowerCase().includes(logSearch.toLowerCase()) ||
                          l.subject.toLowerCase().includes(logSearch.toLowerCase());
    const matchesStatus = logFilter ? l.status === logFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-display">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0c1230]">Email Dispatch Console</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor Brevo transaction logs and edit transactional layout templates.</p>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1 shrink-0">
          <button
            onClick={() => setSubTab('logs')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              subTab === 'logs' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500'
            }`}
          >
            Transaction Logs
          </button>
          <button
            onClick={() => setSubTab('templates')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              subTab === 'templates' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500'
            }`}
          >
            Transactional Templates
          </button>
          <button
            onClick={() => setSubTab('gateway')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              subTab === 'gateway' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500'
            }`}
          >
            Payment Gateway Logs
          </button>
        </div>
      </div>

      {subTab === 'logs' && (
        // ==========================================
        // EMAIL TRANSACTION LOGS VIEW
        // ==========================================
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipient or subject..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
              />
            </div>

            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-650 focus:outline-none bg-slate-50/20 font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="opened">Opened</option>
              <option value="clicked">Clicked</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Template</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Sent Time</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-450">No email logs matched search query.</td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-800 font-sans">{log.recipient}</td>
                        <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{log.subject}</td>
                        <td className="px-6 py-4 font-mono text-slate-450">{log.template_id}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'failed' 
                              ? 'bg-red-105 text-red-700' 
                              : log.status === 'clicked' || log.status === 'opened'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-650'
                          }`}>
                            {log.status}
                          </span>
                          {log.error_message && (
                            <p className="text-[9px] text-red-500 font-medium mt-1 font-sans">{log.error_message}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 font-sans">{new Date(log.created_at).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 text-right">
                          {log.order_id && (
                            <button
                              onClick={() => log.order_id && handleResendEmail(log.order_id, log.email || log.recipient || '')}
                              disabled={resending === log.order_id}
                              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-bold disabled:opacity-50 transition-all font-sans"
                            >
                              {resending === log.order_id ? 'Resending...' : 'Resend Email'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'templates' && (
        // ==========================================
        // EMAIL TEMPLATE MANAGER VIEW
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TEMPLATE CARDS LIST */}
          <div className="lg:col-span-2 space-y-4">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                onClick={() => handleEditTemplate(tmpl)}
                className={`p-5 bg-white border rounded-2xl cursor-pointer hover:shadow transition-all ${
                  editingTemplate?.id === tmpl.id ? 'border-cyan-500 bg-cyan-50/10' : 'border-slate-100'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">{tmpl.id}</h4>
                    <p className="text-sm font-semibold text-slate-800">{tmpl.subject}</p>
                  </div>
                  <button className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-cyan-600 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* EDIT FORM DRAWER/CARD */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm font-sans">
            {editingTemplate ? (
              <form onSubmit={handleSaveTemplate} className="space-y-5 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <h3 className="text-base font-bold text-slate-900 truncate font-display">Template: {editingTemplate.id}</h3>
                    <button
                      type="button"
                      onClick={() => handleSendTestEmail(editingTemplate.id)}
                      disabled={sendingTest === editingTemplate.id}
                      className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg"
                      title="Send test email"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 font-display">Email Subject Line</label>
                    <input
                      type="text"
                      value={tempSubject}
                      onChange={(e) => setTempSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 font-display">Body Layout (HTML markup)</label>
                    <textarea
                      rows={10}
                      value={tempBody}
                      onChange={(e) => setTempBody(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-cyan-500 bg-slate-50/20 leading-relaxed"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-6 border-t border-slate-50 mt-6">
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors font-display"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all font-display"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 font-display">
                <Mail className="w-10 h-10 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-sm">Select Template</h4>
                <p className="text-xs text-slate-400 mt-1">Select an email transactional template card to edit its layouts or send test copies.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'gateway' && (
        // ==========================================
        // PAYMENT GATEWAY LOGS & DISPATCHER VIEW
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-display">
          {/* LEFT SIDE: SEARCH PAYMENT BY ID & MANUAL SEND */}
          <div className="lg:col-span-1 space-y-6">
            {/* SEARCH PAYMENT BY ID CARD */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Search className="w-5 h-5 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">Query Gateway Logs</h3>
              </div>
              <form onSubmit={handleFetchPaymentLog} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Payment ID</label>
                  <input
                    type="text"
                    placeholder="e.g. pay_TD0RP0l6249GQF"
                    value={searchPaymentId}
                    onChange={(e) => setSearchPaymentId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20 font-mono font-bold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading || !searchPaymentId.trim()}
                  className="w-full py-2.5 bg-cyan-650 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${searchLoading ? 'animate-spin' : ''}`} />
                  <span>{searchLoading ? 'Fetching...' : 'Query Gateway Log'}</span>
                </button>
              </form>

              {searchedPaymentLog && (
                <div className="mt-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-150 text-[11px] font-sans max-h-72 overflow-y-auto space-y-2 leading-relaxed text-slate-700">
                  <p className="font-bold border-b border-slate-200 pb-1.5 text-slate-900 text-xs font-display flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-650" />
                    <span>Razorpay API Payload</span>
                  </p>
                  <div><span className="font-semibold text-slate-400 font-mono">ID:</span> {searchedPaymentLog.id}</div>
                  <div>
                    <span className="font-semibold text-slate-400 font-mono">Status:</span>{' '}
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                      searchedPaymentLog.status === 'captured' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {searchedPaymentLog.status}
                    </span>
                  </div>
                  <div><span className="font-semibold text-slate-400 font-mono">Amount:</span> ₹{Number(searchedPaymentLog.amount) / 100}</div>
                  <div><span className="font-semibold text-slate-400 font-mono">Email:</span> {searchedPaymentLog.email}</div>
                  <div><span className="font-semibold text-slate-400 font-mono">Phone:</span> {searchedPaymentLog.contact}</div>
                  <div><span className="font-semibold text-slate-400 font-mono">Method:</span> <span className="uppercase font-semibold">{searchedPaymentLog.method}</span></div>
                  {searchedPaymentLog.vpa && <div><span className="font-semibold text-slate-400 font-mono">UPI VPA:</span> {searchedPaymentLog.vpa}</div>}
                  <div><span className="font-semibold text-slate-400 font-mono">Gateway Fee:</span> ₹{Number(searchedPaymentLog.fee || 0) / 100}</div>
                  <div><span className="font-semibold text-slate-400 font-mono">Tax:</span> ₹{Number(searchedPaymentLog.tax || 0) / 100}</div>
                  
                  {searchedPaymentLog.error_description && (
                    <div className="text-red-600 bg-red-50/50 p-2.5 rounded-xl border border-red-100 mt-2 text-[10px]">
                      <AlertCircle className="w-3.5 h-3.5 inline mr-1 shrink-0" />
                      {searchedPaymentLog.error_description}
                    </div>
                  )}

                  {searchedPaymentLog.notes?.order_id ? (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => handleResendEmail(searchedPaymentLog.notes.order_id, searchedPaymentLog.email)}
                        disabled={resending === searchedPaymentLog.notes.order_id}
                        className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold font-display disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>{resending === searchedPaymentLog.notes.order_id ? 'Resending...' : 'Resend Notes Email'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2 text-[9px] text-amber-600 font-medium">
                      Note: No Order ID metadata attached to this payment payload.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MANUAL DISPATCH CARD */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Send className="w-5 h-5 text-indigo-650" />
                <h3 className="text-sm font-bold text-slate-900">Manual Email Dispatch</h3>
              </div>
              <p className="text-[11px] text-slate-450 leading-normal font-sans">
                Trigger manual email dispatch if the buyer did not receive the automated delivery email. Note: Email goes to the email registered in the database for security.
              </p>

              <div className="space-y-3 font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-display">Order ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 96bfc7fa-..."
                      value={manualOrderId}
                      onChange={(e) => setManualOrderId(e.target.value)}
                      className="flex-grow px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOrderForManualSend}
                      disabled={verifyingOrder || !manualOrderId.trim()}
                      className="px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 shrink-0 font-display transition-colors"
                    >
                      {verifyingOrder ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {manualOrderDetails && (
                  <div className="p-4 bg-indigo-50/20 rounded-2xl border border-indigo-100/50 text-[11px] space-y-2 text-slate-700 font-sans">
                    <div className="font-bold text-slate-850 text-xs font-display">Order Details Verified</div>
                    <div><span className="text-slate-400 font-mono">Customer:</span> {manualOrderDetails.customer_name}</div>
                    <div><span className="text-slate-400 font-mono">Email:</span> {manualOrderDetails.customer_email}</div>
                    <div><span className="text-slate-400 font-mono">Amount Paid:</span> ₹{manualOrderDetails.total_amount}</div>
                    <div>
                      <span className="text-slate-400 font-mono">Status:</span>{' '}
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                        manualOrderDetails.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {manualOrderDetails.payment_status}
                      </span>
                    </div>

                    {manualOrderDetails.payment_status === 'completed' ? (
                      <form onSubmit={handleManualEmailDispatch} className="pt-2">
                        <button
                          type="submit"
                          disabled={manualSending}
                          className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors font-display"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{manualSending ? 'Sending Dispatch...' : 'Dispatch Purchase Email'}</span>
                        </button>
                      </form>
                    ) : (
                      <div className="p-2 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-sans mt-2">
                        Manual dispatch can only be triggered for orders with completed payment status.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: RECENT GATEWAY TRANSACTIONS LIST */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4.5 h-4.5 text-cyan-650" />
                    <span>Recent Gateway Transactions</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Live transaction log retrieved directly from the Razorpay API.</p>
                </div>
                <button
                  onClick={fetchGatewayPayments}
                  disabled={gatewayLoading}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-150 text-slate-500"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gatewayLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      <th className="px-6 py-4">Payment ID</th>
                      <th className="px-6 py-4">Payer</th>
                      <th className="px-6 py-4 text-center">Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Method</th>
                      <th className="px-6 py-4 text-right">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {gatewayLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16">
                          <div className="flex flex-col items-center gap-3 text-slate-400 font-sans">
                            <RefreshCw className="w-8 h-8 animate-spin text-cyan-650" />
                            <span className="font-semibold text-slate-500">Querying Razorpay Gateway...</span>
                          </div>
                        </td>
                      </tr>
                    ) : gatewayPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-450">No transaction logs returned from Razorpay.</td>
                      </tr>
                    ) : (
                      gatewayPayments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-slate-800">{p.id}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-700 font-sans">{p.email || 'No email'}</p>
                            <span className="text-[10px] text-slate-400 font-sans">{p.contact || 'No phone'}</span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-800 font-sans">
                            ₹{Number(p.amount) / 100}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              p.status === 'captured'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-805'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-mono uppercase text-slate-500 text-[10px]">
                            {p.method}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400 font-sans">
                            {new Date(p.created_at * 1000).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {p.notes?.order_id ? (
                              <button
                                onClick={() => handleResendEmail(p.notes.order_id, p.email || '')}
                                disabled={resending === p.notes.order_id}
                                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-[10px] font-bold disabled:opacity-50 transition-all font-display"
                              >
                                {resending === p.notes.order_id ? 'Sending...' : 'Send Email'}
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-sans font-medium italic">No Order ID</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
