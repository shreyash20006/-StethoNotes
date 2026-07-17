import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase, isLiveSupabase, triggerBrevoEmailSimulation } from '../lib/supabase';
import type { Note, Order } from '../types';
import { BookOpen, User, Phone, Mail, Send, History, Save, RefreshCw, Undo2, X, Gift, LifeBuoy, FileDown } from 'lucide-react';
import ReferralCard from '../components/ReferralCard';
import SupportTickets from '../components/support/SupportTickets';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'purchases' | 'profile' | 'orders' | 'referral' | 'support'>('purchases');
  const [purchasedNotes, setPurchasedNotes] = useState<Note[]>([]);
  const [ordersHistory, setOrdersHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile forms
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Email resend spinner states
  const [resendingNoteId, setResendingNoteId] = useState<string | null>(null);

  // Track which order contains which note to trigger resends
  const [noteToOrderMap, setNoteToOrderMap] = useState<Record<string, string>>({});

  // Refund flow state
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundedOrderIds, setRefundedOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('refunds')
        .select('order_id, status')
        .eq('user_id', user.id);
      if (data) {
        setRefundedOrderIds(new Set(data.map((r: any) => r.order_id)));
      }
    })();
  }, [user?.id, ordersHistory.length]);

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // Try to find existing invoice
      const { data: existing } = await supabase
        .from('invoices')
        .select('storage_path, generation_status')
        .eq('order_id', orderId)
        .maybeSingle();

      let path = existing?.storage_path;
      if (!existing || existing.generation_status !== 'generated' || !path) {
        // Generate on-demand
        addToast('info', 'Generating Invoice…', 'Please wait a moment.');
        const { data, error } = await supabase.functions.invoke('generate-invoice', {
          body: { order_id: orderId },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.message || 'Invoice generation failed.');
        if (data.signed_url) {
          window.open(data.signed_url, '_blank');
          return;
        }
        path = data.storage_path;
      }

      const { data: signed, error: signErr } = await supabase.storage
        .from('invoices')
        .createSignedUrl(path!, 3600);
      if (signErr || !signed?.signedUrl) throw signErr || new Error('Could not create signed URL.');
      window.open(signed.signedUrl, '_blank');
    } catch (err: any) {
      addToast('error', 'Invoice Failed', err.message || 'Could not download invoice.');
    }
  };

  const handleRefundRequest = async () => {
    if (!refundModalOrder || !user) return;
    if (refundReason.trim().length < 10) {
      addToast('error', 'Reason too short', 'Please provide at least 10 characters describing why you need a refund.');
      return;
    }
    setSubmittingRefund(true);
    try {
      const { error } = await supabase.from('refunds').insert({
        order_id: refundModalOrder.id,
        user_id: user.id,
        razorpay_payment_id: refundModalOrder.razorpay_payment_id,
        amount: refundModalOrder.total_amount,
        reason: refundReason.trim(),
        status: 'requested',
      });
      if (error) throw error;

      await supabase
        .from('orders')
        .update({ refund_status: 'requested' })
        .eq('id', refundModalOrder.id);

      setRefundedOrderIds(prev => new Set([...prev, refundModalOrder.id]));
      addToast('success', 'Refund Requested', 'Your refund request has been sent to our admin team. You will be notified within 3-5 business days.');
      setRefundModalOrder(null);
      setRefundReason('');
    } catch (err: any) {
      addToast('error', 'Refund Request Failed', err.message || 'Could not submit refund request.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['purchases', 'profile', 'orders', 'referral', 'support'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [window.location.search]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setName(user.name);
    setPhone(user.phone || '');

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch completed orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false });

        if (ordersData) {
          setOrdersHistory(ordersData);

          if (ordersData.length > 0) {
            const orderIds = ordersData.map((o: any) => o.id);

            // 2. Fetch order items and expand notes details
            const { data: itemsData } = await supabase
              .from('order_items')
              .select('*, note:notes(*)')
              .in('order_id', orderIds);

            if (itemsData) {
              const uniqueNotes: Record<string, Note> = {};
              const noteMap: Record<string, string> = {};

              itemsData.forEach((item: any) => {
                if (item.note) {
                  uniqueNotes[item.note.id] = item.note;
                  // Map note ID to its order ID for email trigger
                  noteMap[item.note.id] = item.order_id;
                }
              });

              setNoteToOrderMap(noteMap);
              setPurchasedNotes(Object.values(uniqueNotes));
            }
          }
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const success = await updateProfile(name, phone);
      if (success) {
        addToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
      } else {
        throw new Error('Could not save details.');
      }
    } catch (err: any) {
      addToast('error', 'Profile Update Failed', err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleEmailNotes = async (noteId: string, noteTitle: string) => {
    const matchedOrderId = noteToOrderMap[noteId];
    if (!matchedOrderId) {
      addToast('error', 'Order Match Failed', 'Could not locate purchase record for this note.');
      return;
    }

    setResendingNoteId(noteId);
    try {
      if (isLiveSupabase) {
        const functionName = 'send-order-email';
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (!supabaseUrl) {
          throw new Error('Supabase URL is not configured. Cannot call Edge Function.');
        }
        const url = `${supabaseUrl}/functions/v1/${functionName}`;
        console.log("Calling Edge Function:", functionName);
        console.log("Request URL:", url);

        let data = null;
        let error = null;
        try {
          const res = await supabase.functions.invoke(functionName, {
            body: { orderId: matchedOrderId }
          });
          data = res.data;
          error = res.error;
          if (error) {
            throw error;
          }
        } catch (err: any) {
          console.error(err);
          if (err.context && typeof err.context.text === 'function') {
            try {
              console.error(await err.context.text());
            } catch (e) {}
          }
          throw err;
        }
        if (data?.success) {
          addToast('success', 'Email Sent', `Your PDF guide for "${noteTitle}" has been sent to your inbox.`);
        } else {
          throw new Error(data?.message || 'Email delivery failed');
        }
      } else {
        const success = await triggerBrevoEmailSimulation(matchedOrderId);
        if (success) {
          addToast('success', 'Email Sent (Demo Mode)', `Simulated Brevo email sent successfully for "${noteTitle}".`);
        } else {
          throw new Error('Simulated delivery failure.');
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Delivery Failed', err.message || 'Could not trigger email send.');
    } finally {
      setResendingNoteId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-void max-w-7xl mx-auto px-4 py-24 min-h-[60vh] flex flex-col items-center justify-center gap-4 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="text-muted text-sm font-display">Loading your student dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-void max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen text-white">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-card/65 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl h-fit flex flex-col gap-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-display font-extrabold text-lg text-white">{user?.name}</h3>
            <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary font-sans px-2 py-0.5 rounded-full capitalize font-semibold mt-1 inline-block">
              {user?.role} Student
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                activeTab === 'purchases'
                  ? 'bg-primary/10 border border-primary/20 text-primary font-semibold'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              <span>My Purchases</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                activeTab === 'profile'
                  ? 'bg-primary/10 border border-primary/20 text-primary font-semibold'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <User className="w-4.5 h-4.5" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                activeTab === 'orders'
                  ? 'bg-primary/10 border border-primary/20 text-primary font-semibold'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <History className="w-4.5 h-4.5" />
              <span>Order History</span>
            </button>

            <button
              onClick={() => setActiveTab('referral')}
              data-testid="tab-referral"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                activeTab === 'referral'
                  ? 'bg-primary/10 border border-primary/20 text-primary font-semibold'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <Gift className="w-4.5 h-4.5" />
              <span>Refer & Earn</span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              data-testid="tab-support"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                activeTab === 'support'
                  ? 'bg-primary/10 border border-primary/20 text-primary font-semibold'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <LifeBuoy className="w-4.5 h-4.5" />
              <span>Support</span>
            </button>
          </div>
        </aside>

        {/* Tab Contents Panel */}
        <main className="flex-1 bg-card/65 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Tab 1: Purchases */}
          {activeTab === 'purchases' && (
            <div>
              <h2 className="text-xl font-display font-bold text-white mb-6">
                Purchased Study Material
              </h2>

              {purchasedNotes.length === 0 ? (
                <div className="text-center py-16 bg-void/50 border border-white/5 rounded-2xl flex flex-col items-center gap-4">
                  <BookOpen className="w-12 h-12 text-muted" />
                  <h3 className="font-display font-semibold text-white">No Notes Purchased Yet</h3>
                  <p className="text-muted text-xs max-w-xs">
                    You haven't bought any study notes yet. Your purchases will appear here for instant download.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {purchasedNotes.map((note) => {
                    const resending = resendingNoteId === note.id;
                    return (
                      <div
                        key={note.id}
                        className="border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-void/50 text-white"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-11 rounded-lg bg-void overflow-hidden shrink-0 border border-white/10">
                            <img src={note.thumbnail_url} alt={note.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-[9px] font-sans font-bold text-primary uppercase">
                              {note.subject}
                            </span>
                            <h4 className="font-display font-bold text-sm text-white line-clamp-1">
                              {note.title}
                            </h4>
                            <p className="text-[10px] text-muted font-sans">PDF Guide • Delivered via Email</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEmailNotes(note.id, note.title)}
                          disabled={resending}
                          className="btn-primary py-2 px-5 text-xs font-bold w-full sm:w-auto flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {resending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>Email Me PDF</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Profile Settings */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-display font-bold text-white mb-6">
                Profile Information
              </h2>

              <form onSubmit={handleUpdateProfile} className="max-w-lg flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold text-muted">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none rounded-xl text-xs bg-void text-white font-medium"
                    />
                    <User className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold text-muted">Email Address (Read-only)</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-white/5 bg-void/40 outline-none rounded-xl text-xs text-muted font-medium"
                    />
                    <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold text-muted">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none rounded-xl text-xs bg-void text-white font-medium"
                    />
                    <Phone className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn-primary py-3 px-6 text-xs font-bold w-fit flex items-center gap-1.5 mt-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{updatingProfile ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Order History */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-display font-bold text-white mb-6">
                Transaction History
              </h2>

              {ordersHistory.length === 0 ? (
                <div className="text-center py-16 bg-void/50 border border-white/5 rounded-2xl flex flex-col items-center gap-4">
                  <History className="w-12 h-12 text-muted" />
                  <h3 className="font-display font-semibold text-white">No Orders Found</h3>
                  <p className="text-muted text-xs max-w-xs">
                    You have not placed any orders yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {ordersHistory.map((order) => {
                    const alreadyRefunded = refundedOrderIds.has(order.id);
                    const orderAgeDays = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24);
                    const eligibleForRefund = orderAgeDays <= 7 && !alreadyRefunded;
                    return (
                    <div
                      key={order.id}
                      className="border border-white/5 bg-void/50 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs hover:border-primary/20 text-white transition-all"
                      data-testid={`order-card-${order.id}`}
                    >
                      <div>
                        <p className="font-sans text-muted">Order ID: <span className="text-white font-semibold">{order.id}</span></p>
                        <p className="font-sans text-muted mt-1">Date: <span className="text-white font-semibold">{new Date(order.created_at).toLocaleDateString()}</span></p>
                        <p className="font-sans text-muted mt-1">Payment ID: <span className="text-white font-semibold">{order.razorpay_payment_id || 'N/A'}</span></p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <span className="font-display font-extrabold text-sm text-white">₹{order.total_amount}</span>
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-display font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Completed
                        </span>
                        <button
                          onClick={() => handleDownloadInvoice(order.id)}
                          data-testid={`invoice-btn-${order.id}`}
                          className="text-[10px] font-semibold text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          Download Invoice
                        </button>
                        {alreadyRefunded ? (
                          <span
                            data-testid={`refund-status-${order.id}`}
                            className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-display font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                          >
                            Refund In Review
                          </span>
                        ) : eligibleForRefund ? (
                          <button
                            data-testid={`request-refund-btn-${order.id}`}
                            onClick={() => { setRefundModalOrder(order); setRefundReason(''); }}
                            className="text-[10px] font-semibold text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Request Refund
                          </button>
                        ) : (
                          <span className="text-[9px] text-muted italic">Refund window closed</span>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Refer & Earn */}
          {activeTab === 'referral' && (
            <div>
              <h2 className="text-xl font-display font-bold text-white mb-6">Refer & Earn</h2>
              <ReferralCard />
              <div className="mt-6 bg-void/50 border border-white/5 rounded-2xl p-5 text-xs text-muted">
                <h4 className="font-semibold text-white text-sm mb-2 font-sans">How it works</h4>
                <ol className="list-decimal pl-5 space-y-1 font-sans">
                  <li>Share your unique referral code or link with friends studying medicine, nursing or pharmacy.</li>
                  <li>They sign up on StethoNotes and enter your code during registration.</li>
                  <li>When your friend makes their first purchase of ₹199 or more, you get <strong>₹50 wallet credit</strong> automatically.</li>
                  <li>Wallet credit can be used towards your next purchase.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 5: Support */}
          {activeTab === 'support' && (
            <SupportTickets mode="student" />
          )}
        </main>
      </div>

      {/* Refund Request Modal */}
      {refundModalOrder && (
        <div
          data-testid="refund-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center px-4 text-white"
          onClick={() => !submittingRefund && setRefundModalOrder(null)}
        >
          <div
            className="glass-card-v2 bg-card border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              data-testid="refund-modal-close"
              onClick={() => setRefundModalOrder(null)}
              disabled={submittingRefund}
              className="absolute top-4 right-4 text-muted hover:text-white disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Undo2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">Request Refund</h3>
                <p className="text-xs text-muted">Order #{refundModalOrder.id.substring(0, 8)}...</p>
              </div>
            </div>
            <div className="bg-void/50 border border-white/5 rounded-xl p-3 mb-4 text-xs">
              <div className="flex justify-between mb-1"><span className="text-muted">Amount</span><span className="font-semibold text-white">₹{refundModalOrder.total_amount}</span></div>
              <div className="flex justify-between"><span className="text-muted">Purchased on</span><span className="font-semibold text-white">{new Date(refundModalOrder.created_at).toLocaleDateString()}</span></div>
            </div>
            <label className="block text-xs font-display font-semibold text-muted mb-2">
              Reason for refund <span className="text-red-400">*</span>
            </label>
            <textarea
              data-testid="refund-reason-input"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Please describe why you'd like a refund (min 10 characters)..."
              rows={4}
              className="w-full bg-void border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none resize-none text-white"
              disabled={submittingRefund}
            />
            <p className="text-[10px] text-muted mt-1 font-sans">
              Refund requests are reviewed within 3-5 business days. Approved refunds are processed to your original payment method within 5-7 business days.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setRefundModalOrder(null)}
                disabled={submittingRefund}
                className="flex-1 py-2.5 border border-white/10 rounded-xl text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                data-testid="refund-submit-btn"
                onClick={handleRefundRequest}
                disabled={submittingRefund}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingRefund ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Submitting...</>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
