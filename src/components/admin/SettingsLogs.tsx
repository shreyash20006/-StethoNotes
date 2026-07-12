import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { AuditLog } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import {
  Settings as SettingsIcon, Key, Save,
  Search, Globe
} from 'lucide-react';

export default function SettingsLogs() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'logs'>('settings');

  // Settings Fields State
  const [supportEmail, setSupportEmail] = useState('support@stethonotes.com');
  const [brandLogo, setBrandLogo] = useState('https://stethonotes.com/logo.png');
  const [customDomain, setCustomDomain] = useState('stethonotes.com');
  
  // API credentials fields
  const [razorpayKey, setRazorpayKey] = useState('rzp_test_9D1s7Xj...');
  const [cloudinaryUrl, setCloudinaryUrl] = useState('cloudinary://58238128...');
  const [brevoKey, setBrevoKey] = useState('xkeysib-9281a81283d...');
  const [directDownloadMode, setDirectDownloadMode] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const fetchSettingsAndLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch settings
      const { data: dbSettings } = await supabase.from('settings').select('*');
      (dbSettings || []).forEach((s: any) => {
        if (s.key === 'support_email') setSupportEmail(s.value);
        if (s.key === 'brand_logo') setBrandLogo(s.value);
        if (s.key === 'custom_domain') setCustomDomain(s.value);
        if (s.key === 'razorpay_key') setRazorpayKey(s.value);
        if (s.key === 'cloudinary_url') setCloudinaryUrl(s.value);
        if (s.key === 'brevo_key') setBrevoKey(s.value);
        if (s.key === 'direct_download_mode') {
          const isEnabled = s.value === true || s.value === 'true';
          setDirectDownloadMode(isEnabled);
          localStorage.setItem('direct_download_mode', String(isEnabled));
        }
      });

      // 2. Fetch audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*, profile:profiles(email)')
        .order('created_at', { ascending: false });

      if (logs) {
        setAuditLogs(logs.map((l: any) => ({
          ...l,
          user_email: l.profile?.email || 'System'
        })));
      } else {
        // Fallback seed audit logs for mock mode
        setAuditLogs([
          { id: '1', user_email: 'sb108750@gmail.com', action: 'Approve Seller Application', table_name: 'seller_requests', ip_address: '103.48.92.12', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: '2', user_email: 'shreyashumedkumarborkar@gmail.com', action: 'Update Global SEO', table_name: 'settings', ip_address: '157.34.82.11', created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
          { id: '3', user_email: 'System', action: 'Process Earning Settlement Payout', table_name: 'seller_payouts', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString() }
        ]);
      }

    } catch (err) {
      console.error('Error fetching settings and logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await supabase.from('settings').upsert([
        { key: 'support_email', value: supportEmail, description: 'Brand customer service contact address' },
        { key: 'brand_logo', value: brandLogo, description: 'Website public navigation bar logo URL' },
        { key: 'custom_domain', value: customDomain, description: 'Canonical hostname binding values' },
        { key: 'razorpay_key', value: razorpayKey, description: 'Razorpay public checkout key credential' },
        { key: 'cloudinary_url', value: cloudinaryUrl, description: 'Cloudinary storage file reference path' },
        { key: 'brevo_key', value: brevoKey, description: 'Brevo transactional SMTP credential key' },
        { key: 'direct_download_mode', value: directDownloadMode, description: 'Bypass Razorpay checkout and download directly' }
      ]);

      localStorage.setItem('direct_download_mode', String(directDownloadMode));

      // Record an audit log entry
      await supabase.from('audit_logs').insert({
        action: 'Update System Settings Keys',
        table_name: 'settings',
        new_values: { supportEmail, customDomain }
      });

      addToast('success', 'Settings Saved', 'Third party API credential keys and branding updated successfully.');
      fetchSettingsAndLogs();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredLogs = auditLogs.filter(l =>
    (l.user_email || '').toLowerCase().includes(logSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.table_name.toLowerCase().includes(logSearch.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-[#0c1230]">{activeSubTab === 'settings' ? 'System Settings' : 'Audit Logs'}</h1>
          <p className="text-sm text-slate-500 mt-1">Configure marketplace credentials and track administrator activity logs.</p>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1 shrink-0">
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'settings' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500'
            }`}
          >
            Configurations
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'logs' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500'
            }`}
          >
            Audit Trails
          </button>
        </div>
      </div>

      {activeSubTab === 'settings' ? (
        // ==========================================
        // CONFIGURATIONS PANEL
        // ==========================================
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-cyan-600" />
              <span>API Credentials & Branding settings</span>
            </h3>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-750 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branding Settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Branding Configurations</span>
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Support Contact Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-850 focus:outline-none focus:border-cyan-500 bg-slate-50/20 font-sans"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Custom Domain Hostname</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-850 focus:outline-none focus:border-cyan-500 bg-slate-50/20 font-sans"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Website Logo URL</label>
                <input
                  type="text"
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                  required
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl mt-4">
                <input
                  type="checkbox"
                  id="direct_download_mode"
                  checked={directDownloadMode}
                  onChange={(e) => setDirectDownloadMode(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                />
                <div className="flex flex-col">
                  <label htmlFor="direct_download_mode" className="text-xs font-bold text-slate-850 cursor-pointer">
                    Direct Download Mode
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Bypasses Payments, Brevo, and Checkout (Instant Download = ON)
                  </span>
                </div>
              </div>
            </div>

            {/* API Credentials */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>API Keys & Credentials</span>
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Razorpay Key ID</label>
                <input
                  type="text"
                  value={razorpayKey}
                  onChange={(e) => setRazorpayKey(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none bg-slate-50/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Cloudinary Connection URL</label>
                <input
                  type="text"
                  value={cloudinaryUrl}
                  onChange={(e) => setCloudinaryUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none bg-slate-50/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Brevo API Key (SMTP Send)</label>
                <input
                  type="password"
                  value={brevoKey}
                  onChange={(e) => setBrevoKey(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none bg-slate-50/20"
                />
              </div>
            </div>
          </div>
        </form>
      ) : (
        // ==========================================
        // AUDIT LOGS TABLE VIEW
        // ==========================================
        <div className="space-y-4">
          <div className="flex justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search actor or action..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Action Done</th>
                    <th className="px-6 py-4">Affected Module</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-450">No activity logged matching query.</td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-850 font-sans">{log.user_email}</td>
                        <td className="px-6 py-4 text-slate-600">{log.action}</td>
                        <td className="px-6 py-4 font-mono text-slate-450">{log.table_name}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{log.ip_address || 'Internal Server'}</td>
                        <td className="px-6 py-4 text-right text-slate-400 font-sans">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
