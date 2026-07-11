import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import {
  Store, BookOpen, TrendingUp, DollarSign, Package,
  User, Mail, Phone, Save, LogOut, BarChart3, Clock
} from 'lucide-react';

type SellerTab = 'overview' | 'products' | 'orders' | 'profile';

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const { user, signOut, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<SellerTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/seller/login'); return; }
    if (user.role !== 'seller') {
      if (user.role === 'seller_pending') navigate('/seller/application-pending');
      else if (user.role === 'student') navigate('/dashboard');
      else if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin/dashboard');
      return;
    }
    setName(user.name);
    setPhone(user.phone || '');
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch seller's orders (future: filter by seller_id on notes)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      if (ordersData) setOrders(ordersData);
    } catch (err: any) {
      console.error('Seller dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const ok = await updateProfile(name, phone);
    if (ok) addToast('success', 'Profile Saved', 'Your profile has been updated.');
    else addToast('error', 'Save Failed', 'Could not update profile.');
    setSavingProfile(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/seller/login');
  };

  const tabs: { id: SellerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'products', label: 'My Notes', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-emerald-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">{user?.name}</p>
              <p className="text-xs text-emerald-600 font-medium">Verified Seller</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-slate-500 hover:text-accent transition-colors hidden sm:block">
              Browse Store
            </Link>
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 shrink-0">
            <nav className="bg-white rounded-2xl border border-emerald-100 p-3 shadow-sm flex lg:flex-col gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:block lg:block">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Seller Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                  {[
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <DollarSign className="w-6 h-6 text-emerald-500" />, color: 'emerald' },
                    { label: 'Total Orders', value: orders.length, icon: <Package className="w-6 h-6 text-blue-500" />, color: 'blue' },
                    { label: 'Notes Listed', value: 0, icon: <BookOpen className="w-6 h-6 text-purple-500" />, color: 'purple' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className={`inline-flex w-12 h-12 items-center justify-center rounded-xl bg-${stat.color}-50 mb-3`}>
                        {stat.icon}
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Coming soon sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { icon: <TrendingUp className="w-8 h-8 text-emerald-400" />, title: 'Analytics', desc: 'View detailed sales analytics, conversion rates, and revenue trends.' },
                    { icon: <DollarSign className="w-8 h-8 text-amber-400" />, title: 'Payouts', desc: 'Track your earnings and request withdrawals to your bank account.' },
                  ].map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-dashed border-gray-200">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                          {card.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-700">{card.title}</h3>
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Coming Soon</span>
                          </div>
                          <p className="text-sm text-slate-400">{card.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800">My Notes</h2>
                </div>
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-2">Note Upload Coming Soon</h3>
                  <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
                    The ability to upload and manage your notes is currently being set up. Check back soon!
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs text-amber-700 font-medium">In Development</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Orders</h2>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No orders yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Customer</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Amount</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-700">{order.customer_name}</p>
                              <p className="text-xs text-slate-400">{order.customer_email}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              ₹{order.total_amount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                order.payment_status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {new Date(order.created_at).toLocaleDateString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Seller Profile</h2>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-lg">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-14 h-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <User className="w-7 h-7 text-emerald-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800">{user?.name}</p>
                      <p className="text-xs text-emerald-600 font-medium">Verified Seller</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Full Name</label>
                      <div className="relative">
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none rounded-xl text-slate-800" />
                        <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email</label>
                      <div className="relative">
                        <input type="email" value={user?.email || ''} disabled
                          className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50 rounded-xl text-gray-400 cursor-not-allowed" />
                        <Mail className="w-4 h-4 text-gray-300 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Phone Number</label>
                      <div className="relative">
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none rounded-xl text-slate-800" />
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    <button onClick={handleSaveProfile} disabled={savingProfile}
                      className="flex items-center justify-center gap-2 py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 shadow-md shadow-emerald-200">
                      <Save className="w-4 h-4" />
                      {savingProfile ? 'Saving…' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
