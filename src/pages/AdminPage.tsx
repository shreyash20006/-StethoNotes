import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabase';
import type { Note, Course, Order } from '../types';

const RevenueAnalytics = lazy(() => import('../components/admin/RevenueAnalytics'));
const SellerManager = lazy(() => import('../components/admin/SellerManager'));
const PayoutManager = lazy(() => import('../components/admin/PayoutManager'));
const NotesManager = lazy(() => import('../components/admin/NotesManager'));
const ReviewsCoupons = lazy(() => import('../components/admin/ReviewsCoupons'));
const EmailCenter = lazy(() => import('../components/admin/EmailCenter'));
const StorageSEO = lazy(() => import('../components/admin/StorageSEO'));
const SettingsLogs = lazy(() => import('../components/admin/SettingsLogs'));
const LeakInvestigator = lazy(() => import('../components/admin/LeakInvestigator'));
const RefundsManager = lazy(() => import('../components/admin/RefundsManager'));
const PaymentLogsViewer = lazy(() => import('../components/admin/PaymentLogsViewer'));
const SellerKYCReview = lazy(() => import('../components/admin/SellerKYCReview'));
const WithdrawalsManager = lazy(() => import('../components/admin/WithdrawalsManager'));
const ContactMessages = lazy(() => import('../components/admin/ContactMessages'));
const SiteContentManager = lazy(() => import('../components/admin/SiteContentManager'));
const SupportTickets = lazy(() => import('../components/support/SupportTickets'));

// Lucide Icons
import {
  ShieldCheck, TrendingUp, Package, Users,
  Landmark, Tag, Mail, HardDrive, Settings, FolderOpen,
  ShoppingBag, Search, Plus, Trash2, ArrowRight,
  LogOut, Menu, X, ShieldAlert, Undo2, FileText, Wallet, LifeBuoy, MessageSquare, Palette
} from 'lucide-react';

const TabSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
    </div>
  }>
    {children}
  </Suspense>
);

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
  const customersList = useMemo(() => {
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
  }, [orders]);

  const filteredCourses = useMemo(() => courses.filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase())), [courses, courseSearch]);
  const filteredOrders = useMemo(() => orders.filter(o =>
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.customer_email.toLowerCase().includes(orderSearch.toLowerCase())
  ), [orders, orderSearch]);
  const filteredCustomers = useMemo(() => customersList.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  ), [customersList, customerSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex flex-col lg:flex-row font-display text-white antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-card text-white shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 z-40">
        <div>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-4 h-4 text-void" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight block">StethoNotes</span>
                <span className="text-[10px] text-primary uppercase font-semibold tracking-wider">Admin Control</span>
              </div>
            </div>
            {/* Mobile Menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 text-muted hover:text-white"
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
              { id: 'seller_kyc', label: 'Seller KYC Review', icon: <ShieldCheck className="w-4 h-4" /> },
              { id: 'payouts', label: 'Payout Settlements', icon: <Landmark className="w-4 h-4" /> },
              { id: 'withdrawals', label: 'Seller Withdrawals', icon: <Wallet className="w-4 h-4" /> },
              { id: 'refunds', label: 'Refund Requests', icon: <Undo2 className="w-4 h-4" /> },
              { id: 'payment_logs', label: 'Payment & Webhook Logs', icon: <FileText className="w-4 h-4" /> },
              { id: 'support', label: 'Support Tickets', icon: <LifeBuoy className="w-4 h-4" /> },
              { id: 'contact_messages', label: 'Contact Messages', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'site_content', label: 'Site Content', icon: <Palette className="w-4 h-4" /> },
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
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-inner'
                    : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
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
        <div className={`p-4 border-t border-white/5 lg:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="flex items-center gap-3 mb-4">
            <img src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="Avatar" className="w-9 h-9 rounded-full border border-white/10" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <span className="text-[9px] text-muted truncate block">{user?.email}</span>
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
        {activeTab === 'analytics' && <TabSuspense><RevenueAnalytics /></TabSuspense>}
        {activeTab === 'notes' && <TabSuspense><NotesManager /></TabSuspense>}
        {activeTab === 'sellers' && <TabSuspense><SellerManager /></TabSuspense>}
        {activeTab === 'payouts' && <TabSuspense><PayoutManager /></TabSuspense>}
        {activeTab === 'withdrawals' && <TabSuspense><WithdrawalsManager /></TabSuspense>}
        {activeTab === 'seller_kyc' && <TabSuspense><SellerKYCReview /></TabSuspense>}
        {activeTab === 'refunds' && <TabSuspense><RefundsManager /></TabSuspense>}
        {activeTab === 'payment_logs' && <TabSuspense><PaymentLogsViewer /></TabSuspense>}
        {activeTab === 'support' && <TabSuspense><SupportTickets mode="admin" /></TabSuspense>}
        {activeTab === 'contact_messages' && <TabSuspense><ContactMessages /></TabSuspense>}
        {activeTab === 'site_content' && <TabSuspense><SiteContentManager /></TabSuspense>}
        {activeTab === 'reviews_coupons' && <TabSuspense><ReviewsCoupons /></TabSuspense>}
        {activeTab === 'email_center' && <TabSuspense><EmailCenter /></TabSuspense>}
        {activeTab === 'storage_seo' && <TabSuspense><StorageSEO /></TabSuspense>}
        {activeTab === 'settings_logs' && <TabSuspense><SettingsLogs /></TabSuspense>}
        {activeTab === 'leak_investigator' && <TabSuspense><LeakInvestigator /></TabSuspense>}

        {/* ==========================================
            COURSES MANAGER VIEW
            ========================================== */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Academic Courses</h1>
              <p className="text-sm text-muted mt-1 font-sans">Manage note course boundaries and register catalog channels.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COURSE LIST TABLE */}
              <div className="lg:col-span-2 glass-card-v2 bg-card/60 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-left">
                <div className="p-5 border-b border-white/5 flex items-center justify-between gap-4">
                  <h3 className="text-base font-bold text-white">Registered Courses</h3>
                  <div className="relative w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      placeholder="Search course name..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-white/10 rounded-lg text-xs placeholder-slate-400 bg-void text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-void/50 text-[10px] text-muted uppercase tracking-widest font-semibold font-sans">
                        <th className="px-6 py-4">Course Name</th>
                        <th className="px-6 py-4 text-center">Notes Count</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-white">
                      {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-12 text-muted">No courses matching search query.</td>
                        </tr>
                      ) : (
                        filteredCourses.map(course => {
                            const noteCount = notes.filter(n => n.course_id === course.id).length;
                            return (
                              <tr key={course.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-semibold text-white">{course.name}</td>
                                <td className="px-6 py-4 text-center font-bold text-muted font-sans">{noteCount} items</td>
                                <td className="px-6 py-4 text-right shrink-0">
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="p-1.5 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 rounded-lg transition-colors"
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
              <div className="glass-card-v2 bg-card/60 border border-white/10 p-6 rounded-3xl shadow-2xl h-fit text-left">
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <h3 className="text-base font-bold text-white border-b border-white/5 pb-3">Add Academic Course</h3>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted">Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. MBBS (Medicine)"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50 bg-void"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-void text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
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
            <div className="flex justify-between items-center text-left">
              <div>
                <h1 className="text-3xl font-bold text-white">Order Audits</h1>
                <p className="text-sm text-muted mt-1 font-sans">Review student payments, checkout success logs, and email dispatch.</p>
              </div>
            </div>

            <div className="glass-card-v2 bg-card/60 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-left">
              <div className="p-5 border-b border-white/5 flex items-center justify-between gap-4">
                <h3 className="text-base font-bold text-white">Purchase Transaction Logs</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search name, email, or ID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-white/10 rounded-lg text-xs placeholder-slate-450 bg-void text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-void/50 text-[10px] text-muted uppercase tracking-widest font-semibold font-sans">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Buyer</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Payment ID (Razorpay)</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted">No orders logged matching search query.</td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-white">{order.id}</td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-white">{order.customer_name}</p>
                              <span className="text-[10px] text-muted font-sans">{order.customer_email}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-white font-sans">₹{order.total_amount}</td>
                            <td className="px-6 py-4 font-mono text-muted">{order.razorpay_payment_id || 'Cash/Demo checkout'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                order.payment_status === 'completed'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : order.payment_status === 'failed'
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                              }`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-muted font-sans">{new Date(order.created_at).toLocaleDateString()}</td>
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
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">Customers Log</h1>
              <p className="text-sm text-muted mt-1 font-sans">Review list of registered students who have purchased products.</p>
            </div>

            <div className="glass-card-v2 bg-card/60 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-left">
              <div className="p-5 border-b border-white/5 flex items-center justify-between gap-4">
                <h3 className="text-base font-bold text-white">Customers Database</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-white/10 rounded-lg text-xs placeholder-slate-450 bg-void text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-void/50 text-[10px] text-muted uppercase tracking-widest font-semibold font-sans">
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-center">Orders Count</th>
                      <th className="px-6 py-4 text-right font-semibold">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-muted">No customers mapped.</td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white">{cust.name}</td>
                            <td className="px-6 py-4 text-muted font-sans">{cust.email}</td>
                            <td className="px-6 py-4 text-center font-bold text-muted font-sans">{cust.ordersCount} orders</td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-400 font-sans">₹{cust.spend.toLocaleString()}</td>
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
