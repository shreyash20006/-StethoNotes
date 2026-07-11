import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { SellerRequest, UserProfile } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import {
  CheckCircle2, XCircle, Search, Info,
  Store, CircleCheck, ShieldAlert
} from 'lucide-react';
import { sendSellerApprovalEmail, sendSellerRejectionEmail } from '../../lib/brevo';

interface SellerProfileItem extends UserProfile {
  store_name?: string;
  bio?: string;
  upi_id?: string;
  bank_details?: any;
  total_sales?: number;
  commission?: number;
}

export default function SellerManager() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  
  // Tab states: 'requests' | 'active' | 'suspended'
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'active' | 'suspended'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [activeSellers, setActiveSellers] = useState<SellerProfileItem[]>([]);
  const [suspendedSellers, setSuspendedSellers] = useState<SellerProfileItem[]>([]);
  
  const [selectedRequest, setSelectedRequest] = useState<SellerRequest | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfileItem | null>(null);
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSellersData();
  }, []);

  const fetchSellersData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending seller requests
      const { data: reqData } = await supabase
        .from('seller_requests')
        .select('*')
        .order('applied_at', { ascending: false });
      if (reqData) setRequests(reqData);

      // 2. Fetch profiles joined with seller_profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*, seller_profiles(*)');

      const sellersList: SellerProfileItem[] = (profiles || [])
        .filter((p: any) => p.role === 'seller' || p.role === 'seller_pending' || p.status === 'rejected')
        .map((p: any) => {
          const sp = p.seller_profiles?.[0] || {};
          return {
            ...p,
            store_name: sp.store_name,
            bio: sp.bio,
            upi_id: sp.upi_id,
            bank_details: sp.bank_details,
            total_sales: 0, // Calculated dynamically in future, seed mock for UI
            commission: 0
          };
        });

      // Filter active approved sellers
      const active = sellersList.filter(s => s.role === 'seller' && s.status === 'approved');
      // Filter suspended or rejected sellers
      const suspended = sellersList.filter(s => s.status === 'rejected' || s.status === 'suspended');

      setActiveSellers(active);
      setSuspendedSellers(suspended);

    } catch (err) {
      console.error('Error fetching sellers data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: SellerRequest) => {
    setProcessingId(req.id);
    try {
      // Update profile role to seller + status approved
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: 'seller', status: 'approved' })
        .eq('id', req.user_id);
      if (profileErr) throw profileErr;

      // Update seller_request record
      const { error: reqErr } = await supabase
        .from('seller_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', req.id);
      if (reqErr) throw reqErr;

      // Create seller_profiles template if missing
      await supabase.from('seller_profiles').upsert({
        id: req.user_id,
        store_name: `${req.full_name || 'Seller'}'s Store`,
        bio: 'Approved medical notes seller.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      // Send approval email (fire-and-forget)
      sendSellerApprovalEmail(req.email, req.full_name || req.email).catch(console.error);

      addToast('success', 'Seller Approved', `${req.full_name || req.email} is now an active seller.`);
      setSelectedRequest(null);
      fetchSellersData();
    } catch (err: any) {
      addToast('error', 'Approve Failed', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: SellerRequest) => {
    setProcessingId(req.id);
    try {
      // Update profile status rejected
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', req.user_id);
      if (profileErr) throw profileErr;

      // Update request status rejected
      const { error: reqErr } = await supabase
        .from('seller_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', req.id);
      if (reqErr) throw reqErr;

      // Send rejection email (fire-and-forget)
      sendSellerRejectionEmail(req.email, req.full_name || req.email).catch(console.error);

      addToast('info', 'Seller Rejected', `Seller request from ${req.email} has been rejected.`);
      setSelectedRequest(null);
      fetchSellersData();
    } catch (err: any) {
      addToast('error', 'Rejection Failed', err.message);
    } finally {
      setProcessingId(null);
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

  const filteredRequests = requests.filter(r => 
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActive = activeSellers.filter(s => 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.store_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-display">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-[#0c1230]">Seller Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review applicant requests and moderate active store profiles.</p>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 gap-1">
          {[
            { id: 'requests', label: 'Requests', count: requests.filter(r => r.status === 'pending').length },
            { id: 'active', label: 'Active Sellers', count: activeSellers.length },
            { id: 'suspended', label: 'Suspended/Rejected', count: suspendedSellers.length }
          ].map(tab => (
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
              {tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
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
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Applied Date</th>
                    <th className="px-6 py-4 text-center">Status</th>
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
                        <td className="px-6 py-4 font-semibold text-slate-800">{req.full_name || 'Applicant'}</td>
                        <td className="px-6 py-4 text-slate-500 font-sans">{req.email}</td>
                        <td className="px-6 py-4 text-slate-500 font-sans">{new Date(req.applied_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
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
                    <th className="px-6 py-4 text-center">Commission Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredActive.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-slate-400">No active sellers found.</td>
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
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{seller.store_name || 'Standard Store'}</p>
                          <span className="text-[10px] text-slate-400">by {seller.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-sans">{seller.email}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">10% Platform Fee</td>
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
                  {suspendedSellers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-slate-400">No suspended or rejected sellers.</td>
                    </tr>
                  ) : (
                    suspendedSellers.map(seller => (
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
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">
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
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[300px]">
          {selectedRequest ? (
            <div className="space-y-6 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-cyan-600" />
                  <span>Applicant Profile</span>
                </h3>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400">Full Name</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.full_name || 'Not Provided'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Email Address</span>
                    <p className="font-semibold text-slate-800 mt-0.5 font-sans">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Applied Date</span>
                    <p className="font-semibold text-slate-800 mt-0.5 font-sans">{new Date(selectedRequest.applied_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-50">
                <button
                  disabled={processingId === selectedRequest.id}
                  onClick={() => handleApprove(selectedRequest)}
                  className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  disabled={processingId === selectedRequest.id}
                  onClick={() => handleReject(selectedRequest)}
                  className="flex-grow py-3 bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all border border-red-200"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ) : selectedSeller ? (
            <div className="space-y-6 flex-grow flex flex-col justify-between">
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
                  <div>
                    <span className="text-slate-400">UPI ID for Payments</span>
                    <p className="font-semibold text-slate-800 mt-0.5 font-mono">{selectedSeller.upi_id || 'Not Setup'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Status</span>
                    <p className="mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    className="w-full py-3 bg-red-550 hover:bg-red-650 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
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
    </div>
  );
}
