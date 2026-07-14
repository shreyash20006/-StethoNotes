import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabase';
import type { Note, Course, Order } from '../types';

// Import Admin Subcomponents
import RevenueAnalytics from '../components/admin/RevenueAnalytics';
import SellerManager from '../components/admin/SellerManager';
import PayoutManager from '../components/admin/PayoutManager';
import NotesManager from '../components/admin/NotesManager';
import ReviewsCoupons from '../components/admin/ReviewsCoupons';
import EmailCenter from '../components/admin/EmailCenter';
import StorageSEO from '../components/admin/StorageSEO';
import SettingsLogs from '../components/admin/SettingsLogs';
import LeakInvestigator from '../components/admin/LeakInvestigator';

// Lucide Icons
import {
  ShieldCheck, TrendingUp, Package, Users,
  Landmark, Tag, Mail, HardDrive, Settings, FolderOpen,
  ShoppingBag, Search, Plus, Trash2, ArrowRight,
  LogOut, Menu, X, ShieldAlert
} from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<string>('analytics');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Courses, Orders, and Customers inline states
  const [courses, setCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [newCourseName, setNewCourseName] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [resendingOrderId, setResendingOrderId] = useState<string | null>(null);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Role-based protection: Only admin and super_admin allowed
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      addToast('error', 'Access Denied', 'You do not have permissions to view this administrator panel.');
      navigate('/');
      return;
    }

    fetchAdminLists();
  }, [user, navigate]);

  const fetchAdminLists = async () => {
    setLoading(true);
    try {
      const { data: coursesData } = await supabase.from('courses').select('*');
      const { data: notesData } = await supabase.from('notes').select('*');
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (coursesData) setCourses(coursesData);
      if (notesData) setNotes(notesData);
      if (ordersData) setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching admin list data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setMobileMenuOpen(false);
  };

  const handleResendEmail = async (orderId: string, recipient: string) => {
    if (!confirm(`Are you sure you want to regenerate signed URLs and resend the email to ${recipient}?`)) {
      return;
    }
    setResendingOrderId(orderId);
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
    } catch (err: any) {
      console.error('Error resending email:', err);
      addToast('error', 'Resend Failed', err.message || 'Server encountered an error.');
    } finally {
      setResendingOrderId(null);
    }
  };

  // Course operations
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    try {
      const { error } = await supabase.from('courses').insert({ name: newCourseName.trim() });
      if (error) throw error;

      addToast('success', 'Course Created', `Academic course "${newCourseName}" registered successfully.`);
      setNewCourseName('');
      fetchAdminLists();
    } catch (err: any) {
      addToast('error', 'Creation Failed', err.message);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? All notes mapped to it will lose association.')) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;

      addToast('info', 'Course Deleted', 'Course removed from catalog.');
      fetchAdminLists();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Customer List calculation
  const customersList = (() => {
    const customerMap: Record<string, { email: string; name: string; spend: number; ordersCount: number }> = {};
    orders.forEach(o => {
      if (o.payment_status === 'completed') {
        const email = o.customer_email.toLowerCase().trim();
        if (!customerMap[email]) {
          customerMap[email] = {
            email,
            name: o.customer_name || 'Student',
            spend: 0,
            ordersCount: 0
          };
        }
        customerMap[email].spend += Number(o.total_amount);
        customerMap[email].ordersCount++;
      }
    });
    return Object.values(customerMap);
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-display text-slate-800 antialiased">
      {/* SIDEBAR NAVIGATION (Linear/Shopify-style) */}
      <aside className="w-full lg:w-64 bg-[#0a0f1e] text-white shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 z-40">
        <div>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight block">StethoNotes</span>
                <span className="text-[10px] text-cyan-400 uppercase font-semibold tracking-wider">Admin Control</span>
              </div>
            </div>
            {/* Mobile Menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className={`p-4 space-y-1 lg:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
            {[
              { id: 'analytics', label: 'Revenue Analytics', icon: <TrendingUp className="w-4 h-4" /> },
              { id: 'notes', label: 'Notes Catalogue', icon: <Package className="w-4 h-4" /> },
              { id: 'courses', label: 'Courses Manager', icon: <FolderOpen className="w-4 h-4" /> },
              { id: 'orders', label: 'Order Audits', icon: <ShoppingBag className="w-4 h-4" /> },
              { id: 'customers', label: 'Customers Log', icon: <Users className="w-4 h-4" /> },
              { id: 'sellers', label: 'Seller Moderation', icon: <Users className="w-4 h-4" /> },
              { id: 'payouts', label: 'Payout Settlements', icon: <Landmark className="w-4 h-4" /> },
              { id: 'reviews_coupons', label: 'Reviews & Coupons', icon: <Tag className="w-4 h-4" /> },
              { id: 'email_center', label: 'Email Center', icon: <Mail className="w-4 h-4" /> },
              { id: 'storage_seo', label: 'Storage & SEO', icon: <HardDrive className="w-4 h-4" /> },
              { id: 'leak_investigator', label: 'Leak Investigator', icon: <ShieldAlert className="w-4 h-4" /> },
              { id: 'settings_logs', label: 'Settings & Logs', icon: <Settings className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 opacity-0 transition-opacity ${activeTab === tab.id ? 'opacity-100' : ''}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t border-slate-800/60 lg:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="flex items-center gap-3 mb-4">
            <img src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-700" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <span className="text-[9px] text-slate-400 truncate block">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-6 lg:p-10 max-w-7xl mx-auto w-full min-h-screen">
        {activeTab === 'analytics' && <RevenueAnalytics />}
        {activeTab === 'notes' && <NotesManager />}
        {activeTab === 'sellers' && <SellerManager />}
        {activeTab === 'payouts' && <PayoutManager />}
        {activeTab === 'reviews_coupons' && <ReviewsCoupons />}
        {activeTab === 'email_center' && <EmailCenter />}
        {activeTab === 'storage_seo' && <StorageSEO />}
        {activeTab === 'settings_logs' && <SettingsLogs />}
        {activeTab === 'leak_investigator' && <LeakInvestigator />}

        {/* ==========================================
            COURSES MANAGER VIEW
            ========================================== */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0c1230]">Academic Courses</h1>
              <p className="text-sm text-slate-500 mt-1">Manage note course boundaries and register catalog channels.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COURSE LIST TABLE */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between gap-4">
                  <h3 className="text-base font-bold text-slate-900">Registered Courses</h3>
                  <div className="relative w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search course name..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                        <th className="px-6 py-4">Course Name</th>
                        <th className="px-6 py-4 text-center">Notes Count</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs text-slate-800">
                      {courses.filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase())).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-12 text-slate-450">No courses matching search query.</td>
                        </tr>
                      ) : (
                        courses
                          .filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase()))
                          .map(course => {
                            const noteCount = notes.filter(n => n.course_id === course.id).length;
                            return (
                              <tr key={course.id} className="hover:bg-slate-50/60">
                                <td className="px-6 py-4 font-semibold text-slate-850">{course.name}</td>
                                <td className="px-6 py-4 text-center font-bold text-slate-600 font-sans">{noteCount} items</td>
                                <td className="px-6 py-4 text-right shrink-0">
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="p-1.5 bg-slate-50 border border-slate-250 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NEW COURSE ADD FORM */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm h-fit">
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-50 pb-3">Add Academic Course</h3>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. MBBS (Medicine)"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-850 focus:outline-none focus:border-cyan-500 bg-slate-50/20"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Course</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            ORDERS LIST VIEW
            ========================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#0c1230]">Order Audits</h1>
                <p className="text-sm text-slate-500 mt-1">Review student payments, checkout success logs, and email dispatch.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between gap-4">
                <h3 className="text-base font-bold text-slate-900">Purchase Transaction Logs</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, or ID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Buyer</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Payment ID (Razorpay)</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {orders.filter(o =>
                      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      o.customer_email.toLowerCase().includes(orderSearch.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-450">No orders logged matching search query.</td>
                      </tr>
                    ) : (
                      orders
                        .filter(o =>
                          o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.customer_email.toLowerCase().includes(orderSearch.toLowerCase())
                        )
                        .map(order => (
                          <tr key={order.id} className="hover:bg-slate-50/60">
                            <td className="px-6 py-4 font-mono font-bold text-slate-750">{order.id}</td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{order.customer_name}</p>
                              <span className="text-[10px] text-slate-400 font-sans">{order.customer_email}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800 font-sans">₹{order.total_amount}</td>
                            <td className="px-6 py-4 font-mono text-slate-500">{order.razorpay_payment_id || 'Cash/Demo checkout'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                order.payment_status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : order.payment_status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-400 font-sans">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              {order.payment_status === 'completed' && (
                                <button
                                  onClick={() => handleResendEmail(order.id, order.customer_email)}
                                  disabled={resendingOrderId === order.id}
                                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-bold disabled:opacity-50 transition-all font-sans"
                                >
                                  {resendingOrderId === order.id ? 'Sending...' : 'Resend Email'}
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

        {/* ==========================================
            CUSTOMERS LOG VIEW
            ========================================== */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0c1230]">Customers Log</h1>
              <p className="text-sm text-slate-500 mt-1">Review list of registered students who have purchased products.</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between gap-4">
                <h3 className="text-base font-bold text-slate-900">Customers Database</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-center">Orders Count</th>
                      <th className="px-6 py-4 text-right font-semibold">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {customersList.filter(c =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.email.toLowerCase().includes(customerSearch.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-450">No customers mapped.</td>
                      </tr>
                    ) : (
                      customersList
                        .filter(c =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.email.toLowerCase().includes(customerSearch.toLowerCase())
                        )
                        .map((cust, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="px-6 py-4 font-semibold text-slate-850">{cust.name}</td>
                            <td className="px-6 py-4 text-slate-500 font-sans">{cust.email}</td>
                            <td className="px-6 py-4 text-center font-bold text-slate-600 font-sans">{cust.ordersCount} orders</td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600 font-sans">₹{cust.spend.toLocaleString()}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
