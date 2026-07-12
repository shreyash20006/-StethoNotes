import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { EmailTemplate } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import {
  Mail, Send, CheckCircle2, Edit2, Search
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
  const [subTab, setSubTab] = useState<'logs' | 'templates'>('logs');

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
        </div>
      </div>

      {subTab === 'logs' ? (
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
                      <td colSpan={5} className="text-center py-12 text-slate-450">No email logs matched search query.</td>
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
      ) : (
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
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
            {editingTemplate ? (
              <form onSubmit={handleSaveTemplate} className="space-y-5 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <h3 className="text-base font-bold text-slate-900 truncate">Template: {editingTemplate.id}</h3>
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
                    <label className="text-xs font-semibold text-slate-500">Email Subject Line</label>
                    <input
                      type="text"
                      value={tempSubject}
                      onChange={(e) => setTempSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20 font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Body Layout (HTML markup)</label>
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
                    className="flex-grow py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <Mail className="w-10 h-10 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-sm">Select Template</h4>
                <p className="text-xs text-slate-400 mt-1">Select an email transactional template card to edit its layouts or send test copies.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
