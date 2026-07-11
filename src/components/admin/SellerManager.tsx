import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { SellerApplication, UserProfile } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, XCircle, Search, Info,
  Store, CircleCheck, ShieldAlert, Clock,
  Phone, GraduationCap, BookOpen, CreditCard,
  AlertTriangle, FileText, X
} from 'lucide-react';
import { sendSellerApprovalEmail, sendSellerRejectionEmail } from '../../lib/brevo';

interface SellerProfileItem extends UserProfile {
  store_name?: string;
  bio?: string;
  upi_id?: string;
  bank_details?: any;
  total_sales?: number;
  commission?: number;
  course?: string;
  college?: string;
  year?: string;
}

export default function SellerManager() {
  const { addToast } = useToastStore();
  const { user: currentAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Tab states: 'requests' | 'active' | 'suspended'
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'active' | 'suspended'>('requests');
  const [searchQuery, setSearchQuery] = useState('');

  // Seller Data lists
  const [requests, setRequests] = useState<SellerApplication[]>([]);
  const [activeSellers, setActiveSellers] = useState<SellerProfileItem[]>([]);
  const [suspendedSellers, setSuspendedSellers] = useState<SellerProfileItem[]>([]);

  // Selected item states
  const [selectedRequest, setSelectedRequest] = useState<SellerApplication | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfileItem | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rejection Modal states
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [appToReject, setAppToReject] = useState<SellerApplication | null>(null);

  const fetchSellersData = async () => {
    try {
      // 1. Fetch pending seller applications
      const { data: reqData, error: reqErr } = await supabase
        .from('seller_applications')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (reqErr) throw reqErr;
      
      const pendingApps = (reqData || []).filter((r: SellerApplication) => r.status === 'pending');
      setRequests(pendingApps);

      // 2. Fetch profiles joined with seller_profiles
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*, seller_profiles(*)');
      if (profErr) throw profErr;

      // Map profiles to SellerProfileItem
      const sellersList: SellerProfileItem[] = (profiles || [])
        .filter((p: any) => p.role === 'seller' || p.role === 'seller_pending' || p.status === 'rejected' || p.status === 'suspended')
        .map((p: any) => {
          const sp = p.seller_profiles?.[0] || {};
          return {
            ...p,
            store_name: sp.store_name,
            bio: sp.bio,
            upi_id: sp.upi_id,
            bank_details: sp.bank_details,
            total_sales: 0,
            commission: 0
          };
        });

      // Filter active approved sellers
      const active = sellersList.filter(s => s.role === 'seller' && s.status === 'approved');
      // Filter suspended or rejected sellers (by status check)
      const suspended = sellersList.filter(s => s.status === 'rejected' || s.status === 'suspended');

      // Attempt to load metadata from seller_applications for active/suspended lists if details exist
      const allAppsMap = new Map<string, SellerApplication>();
      (reqData || []).forEach((app: SellerApplication) => {
        allAppsMap.set(app.user_id, app);
      });

      const enrichedActive = active.map(s => {
        const app = allAppsMap.get(s.id);
        if (app) {
          return {
            ...s,
            college: app.college,
            course: app.course,
            year: app.year,
            phone: app.phone,
            upi_id: app.upi_id || s.upi_id,
            bio: app.bio || s.bio
          };
        }
        return s;
      });

      const enrichedSuspended = suspended.map(s => {
        const app = allAppsMap.get(s.id);
        if (app) {
          return {
            ...s,
            college: app.college,
            course: app.course,
            year: app.year,
            phone: app.phone,
            upi_id: app.upi_id || s.upi_id,
            bio: app.bio || s.bio
          };
        }
        return s;
      });

      setActiveSellers(enrichedActive);
      setSuspendedSellers(enrichedSuspended);

    } catch (err: any) {
      console.error('Error fetching sellers data:', err);
      addToast('error', 'Fetch Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellersData();

    // ==========================================
    // SUPABASE REALTIME CHANNEL SUBSCRIPTION
    // ==========================================
    const channel = supabase
      .channel('seller_apps_realtime_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seller_applications'
        },
        (payload: any) => {
          console.log('[REALTIME] Seller application changed:', payload);
          fetchSellersData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (app: SellerApplication) => {
    setProcessingId(app.id);
    try {
      // 1. Update profiles role to seller and status approved
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: 'seller', status: 'approved' })
        .eq('id', app.user_id);
      if (profileErr) throw profileErr;

      // 2. Update seller_applications status, reviewed fields
      const { error: appErr } = await supabase
        .from('seller_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentAdmin?.id || null
        })
        .eq('id', app.id);
      if (appErr) throw appErr;

      // 3. Upsert seller_profiles
      const { error: spErr } = await supabase
        .from('seller_profiles')
        .upsert({
          id: app.user_id,
          store_name: `${app.full_name || 'Seller'}'s Store`,
          bio: app.bio || 'Approved medical notes seller.',
          upi_id: app.upi_id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      if (spErr) throw spErr;

      // Dispatch Brevo approval notification
      sendSellerApprovalEmail(app.email, app.full_name || app.email).catch(console.error);

      addToast('success', 'Seller Approved', `${app.full_name} has been promoted to Seller status.`);
      setSelectedRequest(null);
      fetchSellersData();
    } catch (err: any) {
      addToast('error', 'Approve Failed', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (app: SellerApplication) => {
    setAppToReject(app);
    setRejectionReasonInput('');
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!appToReject) return;
    if (!rejectionReasonInput.trim()) {
      addToast('error', 'Reason Required', 'Please input a reason for rejecting the applicant.');
      return;
    }

    const app = appToReject;
    setProcessingId(app.id);
    setRejectionModalOpen(false);

    try {
      // 1. Update profiles status to rejected, keep role as seller_pending so they view denied panel
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ status: 'rejected', role: 'seller_pending' })
        .eq('id', app.user_id);
      if (profileErr) throw profileErr;

      // 2. Update seller_applications status and rejection reason
      const { error: appErr } = await supabase
        .from('seller_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentAdmin?.id || null,
          rejection_reason: rejectionReasonInput.trim()
        })
        .eq('id', app.id);
      if (appErr) throw appErr;

      // Dispatch Brevo rejection notification
      sendSellerRejectionEmail(app.email, app.full_name || app.email, rejectionReasonInput.trim()).catch(console.error);

      addToast('info', 'Seller Application Rejected', `Application from ${app.email} was rejected.`);
      setSelectedRequest(null);
      fetchSellersData();
    } catch (err: any) {
      addToast('error', 'Rejection Failed', err.message);
    } finally {
      setProcessingId(null);
      setAppToReject(null);
    }
  };

  const handleSuspend = async (seller: SellerProfileItem) => {
    setProcessingId(seller.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', seller.id);
      if (error) throw error;

      addToast('info', 'Seller Suspended', `${seller.name} has been suspended.`);
      setSelectedSeller(null);
      fetchSellersData();
    } catch (err: any) {
      addToast('error', 'Suspension Failed', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReactivate = async (seller: SellerProfileItem) => {
    setProcessingId(seller.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', seller.id);
      if (error) throw error;

      addToast('success', 'Seller Reactivated', `${seller.name} has been reactivated.`);
      setSelectedSeller(null);
      fetchSellersData();
    } catch (err: any) {
      addToast('error', 'Reactivation Failed', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  // Filter queries
  const filteredRequests = requests.filter(r =>
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActive = activeSellers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.store_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.college || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuspended = suspendedSellers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.college || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics summaries
  const pendingCount = requests.length;
  const activeCount = activeSellers.length;
  const rejectedCount = suspendedSellers.filter(s => s.status === 'rejected').length;
  const suspendedCount = suspendedSellers.filter(s => s.status === 'suspended').length;

  return (
    <div className="space-y-6 font-display">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-[#0c1230]">Seller Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review applicant applications and moderate active publisher profiles.</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Card */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Requests</p>
            <h3 className="text-2xl font-bold text-[#0c1230] mt-1 font-sans">{pendingCount}</h3>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approved Sellers</p>
            <h3 className="text-2xl font-bold text-[#0c1230] mt-1 font-sans">{activeCount}</h3>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rejected / Suspended</p>
            <h3 className="text-2xl font-bold text-[#0c1230] mt-1 font-sans">
              {rejectedCount + suspendedCount} <span className="text-xs text-slate-400 font-normal">({rejectedCount} rej, {suspendedCount} susp)</span>
            </h3>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 gap-1">
          {[
            { id: 'requests', label: 'Requests', count: pendingCount },
            { id: 'active', label: 'Active Sellers', count: activeCount },
            { id: 'suspended', label: 'Suspended/Rejected', count: suspendedSellers.length }
          ].map(tab => {
            const count = tab.id === 'requests' ? pendingCount : tab.id === 'active' ? activeCount : suspendedSellers.length;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveSubTab(tab.id as any); setSelectedSeller(null); setSelectedRequest(null); }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search sellers or emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-slate-50/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LIST TABLE COLUMN */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          {activeSubTab === 'requests' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">College & Course</th>
                    <th className="px-6 py-4 text-center">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400">No pending seller applications.</td>
                    </tr>
                  ) : (
                    filteredRequests.map(req => (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedRequest?.id === req.id ? 'bg-cyan-50/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          {req.profile_photo_url ? (
                            <img src={req.profile_photo_url} alt="Photo" className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0 uppercase">
                              {req.full_name.slice(0, 2)}
                            </div>
                          )}
                          <span className="font-semibold text-slate-800">{req.full_name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-sans">{req.email}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-700 truncate max-w-[180px]">{req.college}</p>
                          <span className="text-[10px] text-slate-400">{req.course} ({req.year})</span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 font-sans">{new Date(req.submitted_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === 'active' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    <th className="px-6 py-4">Store / Seller</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">UPI Payout ID</th>
                    <th className="px-6 py-4 text-center">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredActive.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400">No active sellers found.</td>
                    </tr>
                  ) : (
                    filteredActive.map(seller => (
                      <tr
                        key={seller.id}
                        onClick={() => setSelectedSeller(seller)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedSeller?.id === seller.id ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          {seller.avatar_url ? (
                            <img src={seller.avatar_url} alt="Photo" className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                              SE
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{seller.store_name || 'Standard Store'}</p>
                            <span className="text-[10px] text-slate-400">by {seller.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-sans">{seller.email}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono">{seller.upi_id || 'Not Setup'}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">10% Fee</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === 'suspended' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    <th className="px-6 py-4">Seller</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredSuspended.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-slate-400">No suspended or rejected sellers.</td>
                    </tr>
                  ) : (
                    filteredSuspended.map(seller => (
                      <tr
                        key={seller.id}
                        onClick={() => setSelectedSeller(seller)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedSeller?.id === seller.id ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800">{seller.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-sans">{seller.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            seller.status === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {seller.status || 'rejected'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DETAILS SIDEBAR CARD */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[400px]">
          {selectedRequest ? (
            <div className="space-y-6 flex-grow flex flex-col justify-between text-left">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  {selectedRequest.profile_photo_url ? (
                    <img src={selectedRequest.profile_photo_url} alt="Photo" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase text-base">
                      {selectedRequest.full_name.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{selectedRequest.full_name}</h3>
                    <p className="text-xs text-slate-400 font-sans">{selectedRequest.email}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-50 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">UPI Payout ID</span>
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">{selectedRequest.upi_id}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Phone Number</span>
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedRequest.phone}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">College Name</span>
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span className="leading-relaxed font-medium">{selectedRequest.college}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Course & Year</span>
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedRequest.course} — {selectedRequest.year}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Biographical Profile</span>
                    <p className="text-slate-600 leading-relaxed font-sans mt-0.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 italic">
                      "{selectedRequest.bio || 'No bio description provided.'}"
                    </p>
                  </div>
                  {selectedRequest.government_id_url && (
                    <div>
                      <span className="text-slate-400 block font-semibold mb-1">Attached Government ID</span>
                      <a
                        href={selectedRequest.government_id_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold hover:underline bg-cyan-50 border border-cyan-100 px-3 py-1.5 rounded-xl"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Document PDF</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-50">
                <button
                  disabled={processingId === selectedRequest.id}
                  onClick={() => handleApprove(selectedRequest)}
                  className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-100"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  disabled={processingId === selectedRequest.id}
                  onClick={() => handleOpenRejectModal(selectedRequest)}
                  className="flex-grow py-3 bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all border border-red-200"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ) : selectedSeller ? (
            <div className="space-y-6 flex-grow flex flex-col justify-between text-left">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  <span>Store Profile</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400">Store Name</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedSeller.store_name || 'Standard Seller Store'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Owner Name</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedSeller.name}</p>
                  </div>
                  {selectedSeller.college && (
                    <div>
                      <span className="text-slate-400">Medical College</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedSeller.college}</p>
                    </div>
                  )}
                  {selectedSeller.course && (
                    <div>
                      <span className="text-slate-400">Course & Year</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedSeller.course} ({selectedSeller.year})</p>
                    </div>
                  )}
                  {selectedSeller.phone && (
                    <div>
                      <span className="text-slate-400">Phone Number</span>
                      <p className="font-semibold text-slate-800 mt-0.5 font-sans">{selectedSeller.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">UPI ID for Payments</span>
                    <p className="font-semibold text-slate-800 mt-0.5 font-mono">{selectedSeller.upi_id || 'Not Setup'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Status</span>
                    <p className="mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        selectedSeller.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedSeller.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                {selectedSeller.status === 'approved' ? (
                  <button
                    disabled={processingId === selectedSeller.id}
                    onClick={() => handleSuspend(selectedSeller)}
                    className="w-full py-3 bg-red-650 hover:bg-red-750 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Suspend Seller</span>
                  </button>
                ) : (
                  <button
                    disabled={processingId === selectedSeller.id}
                    onClick={() => handleReactivate(selectedSeller)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CircleCheck className="w-4 h-4" />
                    <span>Reactivate Store</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
              <Info className="w-10 h-10 text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">Select an Item</h4>
              <p className="text-xs text-slate-400 mt-1">Select an applicant or seller profile on the left to show options.</p>
            </div>
          )}
        </div>
      </div>

      {/* REJECTION MODAL */}
      <AnimatePresence>
        {rejectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectionModalOpen(false)}
              className="absolute inset-0 bg-[#0c1230]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 shadow-2xl relative z-10 text-left space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Reject Seller Request</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(false)}
                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide a clear reason for the rejection. The applicant will read this comment inside their portal and will be allowed to re-submit.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Denial</label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="e.g. Attached College ID document is blurry or expired. Please re-upload."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none text-xs transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-200"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
