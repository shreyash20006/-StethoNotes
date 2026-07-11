import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase, isLiveSupabase, triggerBrevoEmailSimulation } from '../lib/supabase';
import type { Note, Order } from '../types';
import { BookOpen, User, Phone, Mail, Send, History, Save, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'purchases' | 'profile' | 'orders'>('purchases');
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['purchases', 'profile', 'orders'].includes(tabParam)) {
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
        const { data, error } = await supabase.functions.invoke('send-order-email', {
          body: { orderId: matchedOrderId }
        });
        if (error) throw error;
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
      <div className="max-w-7xl mx-auto px-4 py-24 min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
        <p className="text-gray-400 text-sm font-display">Loading your student dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-white border border-gray-100 rounded-3xl p-6 shadow-cyan-soft h-fit flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-display font-extrabold text-lg text-primary">{user?.name}</h3>
            <span className="text-[10px] bg-accent/10 text-accent font-sans px-2 py-0.5 rounded-full capitalize font-semibold mt-1 inline-block">
              {user?.role} Student
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                activeTab === 'purchases'
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-primary hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              <span>My Purchases</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                activeTab === 'profile'
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-primary hover:bg-gray-50'
              }`}
            >
              <User className="w-4.5 h-4.5" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                activeTab === 'orders'
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-primary hover:bg-gray-50'
              }`}
            >
              <History className="w-4.5 h-4.5" />
              <span>Order History</span>
            </button>
          </div>
        </aside>

        {/* Tab Contents Panel */}
        <main className="flex-1 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-cyan-soft">
          {/* Tab 1: Purchases */}
          {activeTab === 'purchases' && (
            <div>
              <h2 className="text-xl font-display font-bold text-primary mb-6">
                Purchased Study Material
              </h2>

              {purchasedNotes.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl flex flex-col items-center gap-4">
                  <BookOpen className="w-12 h-12 text-gray-300" />
                  <h3 className="font-display font-semibold text-primary">No Notes Purchased Yet</h3>
                  <p className="text-gray-400 text-xs max-w-xs">
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
                        className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-11 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-100">
                            <img src={note.thumbnail_url} alt={note.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-[9px] font-sans font-bold text-accent uppercase">
                              {note.subject}
                            </span>
                            <h4 className="font-display font-bold text-sm text-primary line-clamp-1">
                              {note.title}
                            </h4>
                            <p className="text-[10px] text-gray-400">PDF Guide • Delivered via Email</p>
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
              <h2 className="text-xl font-display font-bold text-primary mb-6">
                Profile Information
              </h2>

              <form onSubmit={handleUpdateProfile} className="max-w-lg flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold text-gray-400">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl text-xs bg-white text-primary font-medium"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold text-gray-400">Email Address (Read-only)</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-150 bg-gray-50 outline-none rounded-xl text-xs text-gray-400 font-medium"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold text-gray-400">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none rounded-xl text-xs bg-white text-primary font-medium"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
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
              <h2 className="text-xl font-display font-bold text-primary mb-6">
                Transaction History
              </h2>

              {ordersHistory.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl flex flex-col items-center gap-4">
                  <History className="w-12 h-12 text-gray-300" />
                  <h3 className="font-display font-semibold text-primary">No Orders Found</h3>
                  <p className="text-gray-400 text-xs max-w-xs">
                    You have not placed any orders yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {ordersHistory.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-150 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs"
                    >
                      <div>
                        <p className="font-sans text-gray-400">Order ID: <span className="text-primary font-semibold">{order.id}</span></p>
                        <p className="font-sans text-gray-400 mt-1">Date: <span className="text-primary font-semibold">{new Date(order.created_at).toLocaleDateString()}</span></p>
                        <p className="font-sans text-gray-400 mt-1">Payment ID: <span className="text-primary font-semibold">{order.razorpay_payment_id || 'N/A'}</span></p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1 shrink-0">
                        <span className="font-display font-extrabold text-sm text-primary">₹{order.total_amount}</span>
                        <span className="bg-emerald-50 text-emerald-600 font-display font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
