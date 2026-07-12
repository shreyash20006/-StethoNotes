import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, AlertTriangle, RefreshCw, Ban, ShieldAlert, User, Globe, Laptop } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

interface DownloadLog {
  id: string;
  order_id: string;
  note_id: string;
  ip_address: string;
  user_agent: string;
  downloaded_at: string;
  note?: {
    title: string;
    subject: string;
  };
  order?: {
    customer_name: string;
    customer_email: string;
    payment_status: string;
  };
}

export default function LeakInvestigator() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<DownloadLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Analytics
  const [suspiciousOrders, setSuspiciousOrders] = useState<Record<string, { ips: Set<string>; count: number; email: string; name: string }>>({});

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('download_history')
        .select(`
          id,
          order_id,
          note_id,
          ip_address,
          user_agent,
          downloaded_at,
          note:notes(title, subject),
          order:orders(customer_name, customer_email, payment_status)
        `)
        .order('downloaded_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setLogs(data as any);
        analyzeSuspiciousActivity(data as any);
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      addToast('error', 'Fetch Logs Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSuspiciousActivity = (data: DownloadLog[]) => {
    const tracker: Record<string, { ips: Set<string>; count: number; email: string; name: string }> = {};
    
    data.forEach(log => {
      const oId = log.order_id;
      if (!oId) return;

      const email = log.order?.customer_email || 'unknown';
      const name = log.order?.customer_name || 'Buyer';

      if (!tracker[oId]) {
        tracker[oId] = {
          ips: new Set<string>(),
          count: 0,
          email,
          name
        };
      }
      
      tracker[oId].ips.add(log.ip_address);
      tracker[oId].count += 1;
    });

    // Keep only orders with multiple unique IPs or high download rates
    const suspicious: Record<string, { ips: Set<string>; count: number; email: string; name: string }> = {};
    Object.entries(tracker).forEach(([oId, info]) => {
      if (info.ips.size > 1 || info.count > 3) {
        suspicious[oId] = info;
      }
    });

    setSuspiciousOrders(suspicious);
  };

  // Actions
  const handleResetCounter = async (orderId: string, noteId: string) => {
    if (!confirm('Are you sure you want to reset the download logs for this note? This allows the customer 3 new downloads.')) return;
    try {
      const { error } = await supabase
        .from('download_history')
        .delete()
        .eq('order_id', orderId)
        .eq('note_id', noteId);

      if (error) throw error;
      addToast('success', 'Downloads Reset', 'The download count and logs have been cleared.');
      fetchLogs();
    } catch (err: any) {
      addToast('error', 'Reset Failed', err.message);
    }
  };

  const handleBlockAccess = async (orderId: string) => {
    if (!confirm('Are you sure you want to block download access for this order? This marks payment status as failed.')) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId);

      if (error) throw error;
      addToast('info', 'Access Blocked', 'Order payment status set to failed. Downloads revoked.');
      fetchLogs();
    } catch (err: any) {
      addToast('error', 'revocation failed', err.message);
    }
  };

  const handleBanCustomer = async (email: string) => {
    if (!confirm(`Are you sure you want to ban the customer with email: ${email}? This suspends their account profile.`)) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('email', email);

      if (error) throw error;
      addToast('error', 'Customer Banned', `Suspended account status for ${email}.`);
      fetchLogs();
    } catch (err: any) {
      addToast('error', 'Ban Failed', err.message);
    }
  };

  // Search logic
  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      log.order_id.toLowerCase().includes(query) ||
      (log.order?.customer_name || '').toLowerCase().includes(query) ||
      (log.order?.customer_email || '').toLowerCase().includes(query) ||
      (log.note?.title || '').toLowerCase().includes(query) ||
      log.ip_address.includes(query)
    );
  });

  return (
    <div className="space-y-6 text-left">
      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-450 uppercase tracking-widest block mb-1">Total Downloads Logs</span>
          <p className="text-3xl font-extrabold text-[#0c1230]">{logs.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-widest block mb-1">Flagged suspicious Orders</span>
            <p className="text-3xl font-extrabold text-red-500">{Object.keys(suspiciousOrders).length}</p>
          </div>
          {Object.keys(suspiciousOrders).length > 0 && (
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-450 uppercase tracking-widest block mb-1">Active Revocations</span>
          <p className="text-3xl font-extrabold text-slate-800">
            {logs.filter(l => l.order?.payment_status === 'failed').length}
          </p>
        </div>
      </div>

      {/* Flagged Suspicious IP Activities Panel */}
      {Object.keys(suspiciousOrders).length > 0 && (
        <div className="bg-red-50/40 border border-red-100/60 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-sm text-red-950">Suspicious Activity Alerts (Multi-IP Downloads Detected)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(suspiciousOrders).map(([oId, info]) => (
              <div key={oId} className="bg-white rounded-2xl p-4 border border-red-100 shadow-xs flex flex-col justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0c1230]">Order: #{oId.slice(0, 8)}...</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-[9px] uppercase">
                      {info.ips.size} Unique IPs
                    </span>
                  </div>
                  <p className="text-slate-650 font-medium">{info.name} ({info.email})</p>
                  <div className="text-[10px] text-slate-450 flex flex-wrap gap-1 items-center mt-1">
                    <span>IP Addresses:</span>
                    {Array.from(info.ips).map(ip => (
                      <span key={ip} className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[9px] text-slate-600">{ip}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-50">
                  <button
                    onClick={() => handleBlockAccess(oId)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block Access</span>
                  </button>
                  <button
                    onClick={() => handleBanCustomer(info.email)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Ban Buyer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Search and Log Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {/* Table header with Search */}
        <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Download Audits & Leak Records</h3>
            <p className="text-xs text-slate-450 mt-0.5">Investigate credentials and reset limits for customers.</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search log, order, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 bg-white text-xs rounded-xl"
              />
            </div>
            <button
              onClick={fetchLogs}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading digital log records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Globe className="w-10 h-10 text-slate-350 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-650">No logs matching criteria</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/30 uppercase text-[9px] font-bold font-sans">
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Note Title</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Device Info</th>
                  <th className="p-4">Date / Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map(log => {
                  const isBlocked = log.order?.payment_status === 'failed';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <span className="font-bold text-[#0c1230] block">{log.order?.customer_name || 'Buyer'}</span>
                            <span className="text-[10px] text-slate-450 font-mono block">{log.order?.customer_email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-[200px] truncate">
                          <span className="font-semibold text-slate-750 block truncate">{log.note?.title || 'Note deleted'}</span>
                          <span className="text-[10px] text-slate-450 block font-mono">Order: #{log.order_id.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.ip_address}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-[150px] truncate flex items-center gap-1.5 text-slate-500">
                          <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate" title={log.user_agent}>{log.user_agent}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(log.downloaded_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleResetCounter(log.order_id, log.note_id)}
                            className="p-1.5 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 rounded-lg border border-cyan-100 transition-colors"
                            title="Reset Download logs (Restore 3 limits)"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleBlockAccess(log.order_id)}
                            disabled={isBlocked}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isBlocked 
                                ? 'bg-slate-100 text-slate-450 border-slate-200 cursor-not-allowed'
                                : 'hover:bg-red-50 text-red-500 hover:text-red-650 border-red-150'
                            }`}
                            title={isBlocked ? 'Access already blocked' : 'Revoke download access'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
